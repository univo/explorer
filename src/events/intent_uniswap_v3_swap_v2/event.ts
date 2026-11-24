import { defineEvent } from "univo";
import { and, asc, inArray } from "drizzle-orm";
import { decodeFunctionData, getAddress, hexToNumber, isAddressEqual, parseAbi, toFunctionSelector } from "viem";

import { table } from "./table";
import type { Id } from "@/events";
import { inTuple } from "@/db/types";
import type { Chain } from "@/constants";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v4 } from "@/indexes/index_account_v4";
import { getChain, getExternalChain, getInternalChain } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface IntentUniswapV3SwapV2 {
	tag: "intent_uniswap_v3_swap_v2";
	chain: Chain;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	success: boolean;
	swap_type: "exact_input" | "exact_output";
	exact_quantity: `0x${string}`;
	limit_quantity: `0x${string}`;
	router_address: `0x${string}`;
	sender_address: `0x${string}`;
	token_in_address: `0x${string}`;
	token_out_address: `0x${string}`;
	recipient_address: `0x${string}`;
}

type DecodedSwap = Omit<IntentUniswapV3SwapV2, "tag" | "chain" | "tx_index" | "log_index" | "block_number" | "block_timestamp" | "success">;

export const UNISWAP_V3_SWAP_ROUTER_DEPLOYED_BLOCK = 12369634;
export const UNISWAP_V3_ARBITRUM_SWAP_ROUTER_DEPLOYED_BLOCK = 169;
export const UNISWAP_V3_ARBITRUM_SWAP_ROUTER_02_DEPLOYED_BLOCK = 3856803;
export const UNISWAP_V3_BASE_SWAP_ROUTER_02_DEPLOYED_BLOCK = 1371947;
export const UNISWAP_V3_BASE_SWAP_ROUTER_02_ADDRESS = getAddress("0x2626664c2603336E57B271c5C0b26F421741e481");

// Ethereum and Arbitrum share these router addresses and contract versions:
// v3-periphery@1.0.0 and swap-router-contracts@1.1.0, respectively.
// https://docs.uniswap.org/contracts/v3/reference/deployments/arbitrum-deployments
export const UNISWAP_V3_SWAP_ROUTER_ADDRESS = getAddress("0xE592427A0AEce92De3Edee1F18E0157C05861564");
export const UNISWAP_V3_SWAP_ROUTER_02_ADDRESS = getAddress("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45");

const SWAP_ROUTER_ABI = parseAbi([
	"function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
	"function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum) params) payable returns (uint256 amountOut)",
	"function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountIn)",
	"function exactOutput((bytes path, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum) params) payable returns (uint256 amountIn)",
]);

const SWAP_ROUTER_02_ABI = parseAbi([
	"function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
	"function exactInput((bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum) params) payable returns (uint256 amountOut)",
	"function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountIn)",
	"function exactOutput((bytes path, address recipient, uint256 amountOut, uint256 amountInMaximum) params) payable returns (uint256 amountIn)",
]);

const SWAP_ROUTER_FUNCTION_SELECTORS = SWAP_ROUTER_ABI.map(toFunctionSelector);
const SWAP_ROUTER_02_FUNCTION_SELECTORS = SWAP_ROUTER_02_ABI.map(toFunctionSelector);
const SWAP_ROUTER_SELECTORS = new Set<string>(SWAP_ROUTER_FUNCTION_SELECTORS);
const SWAP_ROUTER_02_SELECTORS = new Set<string>(SWAP_ROUTER_02_FUNCTION_SELECTORS);

const MSG_SENDER = getAddress("0x0000000000000000000000000000000000000001");
const ADDRESS_THIS = getAddress("0x0000000000000000000000000000000000000002");
const ZERO_ADDRESS = getAddress("0x0000000000000000000000000000000000000000");

export function decodeUniswapV3Swap(
	routerAddress: `0x${string}`,
	senderAddress: `0x${string}`,
	data: `0x${string}`,
	chain: Chain = 1,
): DecodedSwap | null {
	const selector = data.slice(0, 10);
	const router = getAddress(routerAddress);
	const sender = getAddress(senderAddress);

	if (chain !== 8453 && isAddressEqual(router, UNISWAP_V3_SWAP_ROUTER_ADDRESS)) {
		if (!SWAP_ROUTER_SELECTORS.has(selector)) {
			return null;
		}

		const decoded = decodeFunctionData({ abi: SWAP_ROUTER_ABI, data });

		const recipient = isAddressEqual(decoded.args[0].recipient, ZERO_ADDRESS) ? router : getAddress(decoded.args[0].recipient);

		if (decoded.functionName === "exactInputSingle") {
			const params = decoded.args[0];

			return {
				swap_type: "exact_input",
				router_address: router,
				sender_address: sender,
				recipient_address: recipient,
				exact_quantity: numberToHex(params.amountIn),
				token_in_address: getAddress(params.tokenIn),
				token_out_address: getAddress(params.tokenOut),
				limit_quantity: numberToHex(params.amountOutMinimum),
			};
		}

		if (decoded.functionName === "exactInput") {
			const params = decoded.args[0];
			const { tokenIn, tokenOut } = decodePathEndpoints(params.path, false);

			return {
				swap_type: "exact_input",
				router_address: router,
				sender_address: sender,
				recipient_address: recipient,
				exact_quantity: numberToHex(params.amountIn),
				limit_quantity: numberToHex(params.amountOutMinimum),
				token_in_address: tokenIn,
				token_out_address: tokenOut,
			};
		}

		if (decoded.functionName === "exactOutputSingle") {
			const params = decoded.args[0];

			return {
				swap_type: "exact_output",
				router_address: router,
				sender_address: sender,
				recipient_address: recipient,
				exact_quantity: numberToHex(params.amountOut),
				limit_quantity: numberToHex(params.amountInMaximum),
				token_in_address: getAddress(params.tokenIn),
				token_out_address: getAddress(params.tokenOut),
			};
		}

		const params = decoded.args[0];
		const { tokenIn, tokenOut } = decodePathEndpoints(params.path, true);

		return {
			swap_type: "exact_output",
			router_address: router,
			sender_address: sender,
			recipient_address: recipient,
			exact_quantity: numberToHex(params.amountOut),
			limit_quantity: numberToHex(params.amountInMaximum),
			token_in_address: tokenIn,
			token_out_address: tokenOut,
		};
	}

	const router02 = chain === 8453 ? UNISWAP_V3_BASE_SWAP_ROUTER_02_ADDRESS : UNISWAP_V3_SWAP_ROUTER_02_ADDRESS;

	if (!isAddressEqual(router, router02) || !SWAP_ROUTER_02_SELECTORS.has(selector)) {
		return null;
	}

	const decoded = decodeFunctionData({ abi: SWAP_ROUTER_02_ABI, data });
	const recipient = normalizeSwapRouter02Recipient(decoded.args[0].recipient, sender, router);

	if (decoded.functionName === "exactInputSingle") {
		const params = decoded.args[0];

		return {
			swap_type: "exact_input",
			router_address: router,
			sender_address: sender,
			recipient_address: recipient,
			exact_quantity: numberToHex(params.amountIn),
			limit_quantity: numberToHex(params.amountOutMinimum),
			token_in_address: getAddress(params.tokenIn),
			token_out_address: getAddress(params.tokenOut),
		};
	}

	if (decoded.functionName === "exactInput") {
		const params = decoded.args[0];
		const { tokenIn, tokenOut } = decodePathEndpoints(params.path, false);

		return {
			swap_type: "exact_input",
			router_address: router,
			sender_address: sender,
			recipient_address: recipient,
			exact_quantity: numberToHex(params.amountIn),
			limit_quantity: numberToHex(params.amountOutMinimum),
			token_in_address: tokenIn,
			token_out_address: tokenOut,
		};
	}

	if (decoded.functionName === "exactOutputSingle") {
		const params = decoded.args[0];

		return {
			swap_type: "exact_output",
			router_address: router,
			sender_address: sender,
			recipient_address: recipient,
			exact_quantity: numberToHex(params.amountOut),
			limit_quantity: numberToHex(params.amountInMaximum),
			token_in_address: getAddress(params.tokenIn),
			token_out_address: getAddress(params.tokenOut),
		};
	}

	const params = decoded.args[0];
	const { tokenIn, tokenOut } = decodePathEndpoints(params.path, true);

	return {
		swap_type: "exact_output",
		router_address: router,
		sender_address: sender,
		recipient_address: recipient,
		exact_quantity: numberToHex(params.amountOut),
		limit_quantity: numberToHex(params.amountInMaximum),
		token_in_address: tokenIn,
		token_out_address: tokenOut,
	};
}

function decodePathEndpoints(path: `0x${string}`, reversed: boolean) {
	const byteLength = (path.length - 2) / 2;

	if (!Number.isInteger(byteLength) || byteLength < 43 || (byteLength - 20) % 23 !== 0) {
		throw new Error("Invalid Uniswap V3 path");
	}

	const first = getAddress(`0x${path.slice(2, 42)}`);
	const last = getAddress(`0x${path.slice(-40)}`);

	return reversed ? { tokenIn: last, tokenOut: first } : { tokenIn: first, tokenOut: last };
}

function normalizeSwapRouter02Recipient(recipient: `0x${string}`, sender: `0x${string}`, router: `0x${string}`) {
	if (isAddressEqual(recipient, MSG_SENDER)) {
		return sender;
	}

	if (isAddressEqual(recipient, ADDRESS_THIS)) {
		return router;
	}

	return getAddress(recipient);
}

export const event = defineEvent({
	id: "intent_uniswap_v3_swap_v2",

	filters: [
		{
			chain: 1,
			function: SWAP_ROUTER_FUNCTION_SELECTORS[0],
			fromBlock: UNISWAP_V3_SWAP_ROUTER_DEPLOYED_BLOCK,
		},
		{
			chain: 1,
			function: SWAP_ROUTER_FUNCTION_SELECTORS[1],
			fromBlock: UNISWAP_V3_SWAP_ROUTER_DEPLOYED_BLOCK,
		},
		{
			chain: 1,
			function: SWAP_ROUTER_FUNCTION_SELECTORS[2],
			fromBlock: UNISWAP_V3_SWAP_ROUTER_DEPLOYED_BLOCK,
		},
		{
			chain: 1,
			function: SWAP_ROUTER_FUNCTION_SELECTORS[3],
			fromBlock: UNISWAP_V3_SWAP_ROUTER_DEPLOYED_BLOCK,
		},
		{
			chain: 1,
			function: SWAP_ROUTER_02_FUNCTION_SELECTORS[0],
			fromBlock: UNISWAP_V3_SWAP_ROUTER_DEPLOYED_BLOCK,
		},
		{
			chain: 1,
			function: SWAP_ROUTER_02_FUNCTION_SELECTORS[1],
			fromBlock: UNISWAP_V3_SWAP_ROUTER_DEPLOYED_BLOCK,
		},
		{
			chain: 1,
			function: SWAP_ROUTER_02_FUNCTION_SELECTORS[2],
			fromBlock: UNISWAP_V3_SWAP_ROUTER_DEPLOYED_BLOCK,
		},
		{
			chain: 1,
			function: SWAP_ROUTER_02_FUNCTION_SELECTORS[3],
			fromBlock: UNISWAP_V3_SWAP_ROUTER_DEPLOYED_BLOCK,
		},
		{
			chain: 42161,
			address: UNISWAP_V3_SWAP_ROUTER_ADDRESS,
			function: SWAP_ROUTER_FUNCTION_SELECTORS[0],
			fromBlock: UNISWAP_V3_ARBITRUM_SWAP_ROUTER_DEPLOYED_BLOCK,
		},
		{
			chain: 42161,
			address: UNISWAP_V3_SWAP_ROUTER_ADDRESS,
			function: SWAP_ROUTER_FUNCTION_SELECTORS[1],
			fromBlock: UNISWAP_V3_ARBITRUM_SWAP_ROUTER_DEPLOYED_BLOCK,
		},
		{
			chain: 42161,
			address: UNISWAP_V3_SWAP_ROUTER_ADDRESS,
			function: SWAP_ROUTER_FUNCTION_SELECTORS[2],
			fromBlock: UNISWAP_V3_ARBITRUM_SWAP_ROUTER_DEPLOYED_BLOCK,
		},
		{
			chain: 42161,
			address: UNISWAP_V3_SWAP_ROUTER_ADDRESS,
			function: SWAP_ROUTER_FUNCTION_SELECTORS[3],
			fromBlock: UNISWAP_V3_ARBITRUM_SWAP_ROUTER_DEPLOYED_BLOCK,
		},
		{
			chain: 42161,
			address: UNISWAP_V3_SWAP_ROUTER_02_ADDRESS,
			function: SWAP_ROUTER_02_FUNCTION_SELECTORS[0],
			fromBlock: UNISWAP_V3_ARBITRUM_SWAP_ROUTER_02_DEPLOYED_BLOCK,
		},
		{
			chain: 42161,
			address: UNISWAP_V3_SWAP_ROUTER_02_ADDRESS,
			function: SWAP_ROUTER_02_FUNCTION_SELECTORS[1],
			fromBlock: UNISWAP_V3_ARBITRUM_SWAP_ROUTER_02_DEPLOYED_BLOCK,
		},
		{
			chain: 42161,
			address: UNISWAP_V3_SWAP_ROUTER_02_ADDRESS,
			function: SWAP_ROUTER_02_FUNCTION_SELECTORS[2],
			fromBlock: UNISWAP_V3_ARBITRUM_SWAP_ROUTER_02_DEPLOYED_BLOCK,
		},
		{
			chain: 42161,
			address: UNISWAP_V3_SWAP_ROUTER_02_ADDRESS,
			function: SWAP_ROUTER_02_FUNCTION_SELECTORS[3],
			fromBlock: UNISWAP_V3_ARBITRUM_SWAP_ROUTER_02_DEPLOYED_BLOCK,
		},
		{
			chain: 8453,
			address: UNISWAP_V3_BASE_SWAP_ROUTER_02_ADDRESS,
			function: SWAP_ROUTER_02_FUNCTION_SELECTORS[0],
			fromBlock: UNISWAP_V3_BASE_SWAP_ROUTER_02_DEPLOYED_BLOCK,
		},
		{
			chain: 8453,
			address: UNISWAP_V3_BASE_SWAP_ROUTER_02_ADDRESS,
			function: SWAP_ROUTER_02_FUNCTION_SELECTORS[1],
			fromBlock: UNISWAP_V3_BASE_SWAP_ROUTER_02_DEPLOYED_BLOCK,
		},
		{
			chain: 8453,
			address: UNISWAP_V3_BASE_SWAP_ROUTER_02_ADDRESS,
			function: SWAP_ROUTER_02_FUNCTION_SELECTORS[2],
			fromBlock: UNISWAP_V3_BASE_SWAP_ROUTER_02_DEPLOYED_BLOCK,
		},
		{
			chain: 8453,
			address: UNISWAP_V3_BASE_SWAP_ROUTER_02_ADDRESS,
			function: SWAP_ROUTER_02_FUNCTION_SELECTORS[3],
			fromBlock: UNISWAP_V3_BASE_SWAP_ROUTER_02_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap<IntentUniswapV3SwapV2>((tx) => {
			try {
				if (getChain(block.eth_chainId) === 8453 && Number(tx.type) === 126) {
					return [];
				}

				// When deploying a contract the `to` field is null
				if (tx.to === null) {
					return [];
				}

				const swap = decodeUniswapV3Swap(tx.to, tx.from, tx.input, getChain(block.eth_chainId));

				if (swap === null) {
					return [];
				}

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionIndex, tx.transactionIndex));

				return {
					tag: "intent_uniswap_v3_swap_v2",
					chain: getChain(block.eth_chainId),
					log_index: hexToNumber(TRANSACTION_EVENT),
					tx_index: hexToNumber(tx.transactionIndex),
					block_number: hexToNumber(block.eth_getBlockByNumber.number),
					block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
					success: receipt?.status === "0x1",
					swap_type: swap.swap_type,
					exact_quantity: swap.exact_quantity,
					limit_quantity: swap.limit_quantity,
					router_address: swap.router_address,
					sender_address: swap.sender_address,
					token_in_address: swap.token_in_address,
					recipient_address: swap.recipient_address,
					token_out_address: swap.token_out_address,
				};
			} catch {
				return [];
			}
		});
	},

	storage: {
		async upsert(events) {
			const MAX_BATCH_SIZE = 4000;
			const client = await createPostgresClient();

			for (let i = 0; i < events.length; i += MAX_BATCH_SIZE) {
				const rows = events.slice(i, i + MAX_BATCH_SIZE).map((event) => ({ ...event, chain: getInternalChain(event.chain) }));
				await client.insert(table).values(rows);
			}
		},

		async delete(events) {
			const client = await createPostgresClient();

			await client.delete(table).where(
				and(
					inArray(
						table.block_timestamp,
						events.map((event) => event.block_timestamp),
					),
					inTuple(
						[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
						events.map((event) => [
							event.block_timestamp,
							event.block_number,
							event.tx_index,
							event.log_index,
							getInternalChain(event.chain),
						]),
					),
				),
			);
		},
	},
});

export const intent_uniswap_v3_swap_v2_index_block_number_tx_index_v4 = defineEvent({
	filters: event.filters,
	storage: index_block_number_tx_index_v4,
	handler: (block) => event.handler(block),
	id: "intent_uniswap_v3_swap_v2_index_block_number_tx_index_v4",
});

export const intent_uniswap_v3_swap_v2_index_account_v4 = defineEvent({
	filters: event.filters,
	storage: index_account_v4,
	id: "intent_uniswap_v3_swap_v2_index_account_v4",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ id: event, account: event.router_address },
				{ id: event, account: event.sender_address },
				{ id: event, account: event.token_in_address },
				{ id: event, account: event.recipient_address },
				{ id: event, account: event.token_out_address },
			];
		});
	},
});

export async function getIntentUniswapV3SwapV2(ids: Id[]) {
	const filtered = ids.filter((id) => TABLES[id.tag] === TABLES.intent_uniswap_v3_swap_v2);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.selectDistinct()
		.from(table)
		.where(
			and(
				inArray(
					table.block_timestamp,
					filtered.map((id) => id.block_timestamp),
				),
				inTuple(
					[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
					filtered.map((id) => [id.block_timestamp, id.block_number, id.tx_index, id.log_index, getInternalChain(id.chain)]),
				),
			),
		)
		.orderBy(asc(table.block_timestamp), asc(table.block_number), asc(table.tx_index), asc(table.log_index), asc(table.chain));

	return rows.map<IntentUniswapV3SwapV2>((row) => {
		return {
			tag: "intent_uniswap_v3_swap_v2",
			chain: getExternalChain(row.chain),
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			success: row.success,
			swap_type: row.swap_type as "exact_input" | "exact_output",
			exact_quantity: row.exact_quantity,
			limit_quantity: row.limit_quantity,
			router_address: getAddress(row.router_address),
			sender_address: getAddress(row.sender_address),
			token_in_address: getAddress(row.token_in_address),
			recipient_address: getAddress(row.recipient_address),
			token_out_address: getAddress(row.token_out_address),
		};
	});
}
