import { asc, inArray, sql } from "drizzle-orm";
import { decodeFunctionData, getAddress, isAddressEqual, parseAbi, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v3 } from "@/indexes/account-v3";
import { createId, getEventSuccess, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface IntentUniswapV3SwapV1 {
	tag: "intent_uniswap_v3_swap_v1";
	id: string;
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

type DecodedSwap = Omit<IntentUniswapV3SwapV1, "tag" | "id" | "success">;

export const UNISWAP_V3_SWAP_ROUTER_DEPLOYED_BLOCK = 12369634;
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

const SWAP_ROUTER_SELECTORS = new Set<string>(SWAP_ROUTER_ABI.map(toFunctionSelector));
const SWAP_ROUTER_02_SELECTORS = new Set<string>(SWAP_ROUTER_02_ABI.map(toFunctionSelector));

const MSG_SENDER = getAddress("0x0000000000000000000000000000000000000001");
const ADDRESS_THIS = getAddress("0x0000000000000000000000000000000000000002");
const ZERO_ADDRESS = getAddress("0x0000000000000000000000000000000000000000");

export function decodeUniswapV3Swap(
	routerAddress: `0x${string}`,
	senderAddress: `0x${string}`,
	data: `0x${string}`,
): DecodedSwap | null {
	const selector = data.slice(0, 10);
	const router = getAddress(routerAddress);
	const sender = getAddress(senderAddress);

	if (isAddressEqual(router, UNISWAP_V3_SWAP_ROUTER_ADDRESS)) {
		if (!SWAP_ROUTER_SELECTORS.has(selector)) {
			return null;
		}

		const decoded = decodeFunctionData({ abi: SWAP_ROUTER_ABI, data });

		const recipient = isAddressEqual(decoded.args[0].recipient, ZERO_ADDRESS)
			? router
			: getAddress(decoded.args[0].recipient);

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

	if (!isAddressEqual(router, UNISWAP_V3_SWAP_ROUTER_02_ADDRESS) || !SWAP_ROUTER_02_SELECTORS.has(selector)) {
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

export const event = univo.event({
	id: "intent_uniswap_v3_swap_v1",

	filters: [
		{
			chain: 1,
			fromBlock: UNISWAP_V3_SWAP_ROUTER_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
			try {
				// When deploying a contract the `to` field is null
				if (tx.to === null) {
					return [];
				}

				const swap = decodeUniswapV3Swap(tx.to, tx.from, tx.input);

				if (swap === null) {
					return [];
				}

				const id = createId({
					logIndex: TRANSACTION_EVENT,
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_uniswap_v3_swap_v1,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionHash, tx.hash));

				return {
					id,
					success: getEventSuccess(receipt),
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
		async upsert(batch) {
			const MAX_BATCH_SIZE = 8000;
			const client = await createPostgresClient();

			for (let i = 0; i < batch.length; i += MAX_BATCH_SIZE) {
				await client
					.insert(table)
					.values(batch.slice(i, i + MAX_BATCH_SIZE))
					.onConflictDoUpdate({
						target: table.id,
						set: {
							success: sql.raw(`excluded.${table.success.name}`),
							swap_type: sql.raw(`excluded.${table.swap_type.name}`),
							exact_quantity: sql.raw(`excluded.${table.exact_quantity.name}`),
							limit_quantity: sql.raw(`excluded.${table.limit_quantity.name}`),
							router_address: sql.raw(`excluded.${table.router_address.name}`),
							sender_address: sql.raw(`excluded.${table.sender_address.name}`),
							token_in_address: sql.raw(`excluded.${table.token_in_address.name}`),
							recipient_address: sql.raw(`excluded.${table.recipient_address.name}`),
							token_out_address: sql.raw(`excluded.${table.token_out_address.name}`),
						},
					});
			}
		},

		async delete(batch) {
			const client = await createPostgresClient();

			await client.delete(table).where(
				inArray(
					table.id,
					batch.map((event) => event.id),
				),
			);
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_tx_index_v4,
	id: "intent_uniswap_v3_swap_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_uniswap_v3_swap_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.router_address },
				{ event_id: event.id, account: event.sender_address },
				{ event_id: event.id, account: event.token_in_address },
				{ event_id: event.id, account: event.recipient_address },
				{ event_id: event.id, account: event.token_out_address },
			];
		});
	},
});

export async function getIntentUniswapV3SwapV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_uniswap_v3_swap_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentUniswapV3SwapV1>((result) => {
		return {
			tag: "intent_uniswap_v3_swap_v1",
			id: result.id,
			success: result.success,
			swap_type: result.swap_type as "exact_input" | "exact_output",
			exact_quantity: result.exact_quantity,
			limit_quantity: result.limit_quantity,
			router_address: getAddress(result.router_address),
			sender_address: getAddress(result.sender_address),
			recipient_address: getAddress(result.recipient_address),
			token_in_address: getAddress(result.token_in_address),
			token_out_address: getAddress(result.token_out_address),
		};
	});
}
