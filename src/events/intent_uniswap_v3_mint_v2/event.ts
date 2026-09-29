import { and, asc, inArray } from "drizzle-orm";
import {
	decodeFunctionData,
	encodeAbiParameters,
	getAddress,
	getCreate2Address,
	hexToNumber,
	keccak256,
	parseAbi,
	toFunctionSelector,
} from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { inTuple } from "@/db/types";
import type { EventId } from "@/events";
import { getEventSuccess } from "@/helpers";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v4 } from "@/indexes/index_account_v4";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface IntentUniswapV3MintV2 {
	tag: "intent_uniswap_v3_mint_v2";
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	success: boolean;
	fee: `0x${string}`;
	pool_address: `0x${string}`;
	sender_address: `0x${string}`;
	token_0_address: `0x${string}`;
	token_1_address: `0x${string}`;
	recipient_address: `0x${string}`;
	token_0_desired_quantity: `0x${string}`;
	token_1_desired_quantity: `0x${string}`;
	token_0_minimum_quantity: `0x${string}`;
	token_1_minimum_quantity: `0x${string}`;
}

export const UNISWAP_V3_POSITION_MANAGER_DEPLOYED_BLOCK = 12369651;
export const UNISWAP_V3_POSITION_MANAGER_ADDRESS = getAddress("0xC36442b4a4522E871399CD717aBDD847Ab11FE88");

const UNISWAP_V3_FACTORY_ADDRESS = getAddress("0x1F98431c8aD98523631AE4a59f267346ea31F984");
const UNISWAP_V3_POOL_INIT_CODE_HASH = "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";

const MINT_ABI = parseAbi([
	"function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline) params) payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
]);

const MINT_SELECTOR = toFunctionSelector(MINT_ABI[0]);

export const event = univo.event({
	id: "intent_uniswap_v3_mint_v2",

	filters: [
		{
			chain: 1,
			fromBlock: UNISWAP_V3_POSITION_MANAGER_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap<IntentUniswapV3MintV2>((tx) => {
			try {
				// When deploying a contract the `to` field is null
				if (tx.to === null) {
					return [];
				}

				if (!isHexEqual(tx.to, UNISWAP_V3_POSITION_MANAGER_ADDRESS)) {
					return [];
				}

				if (tx.input.slice(0, 10) !== MINT_SELECTOR) {
					return [];
				}

				const { args } = decodeFunctionData({ abi: MINT_ABI, data: tx.input });
				const params = args[0];
				const token0 = getAddress(params.token0);
				const token1 = getAddress(params.token1);

				const poolAddress = getCreate2Address({
					from: UNISWAP_V3_FACTORY_ADDRESS,
					bytecodeHash: UNISWAP_V3_POOL_INIT_CODE_HASH,
					salt: keccak256(
						encodeAbiParameters([{ type: "address" }, { type: "address" }, { type: "uint24" }], [token0, token1, params.fee]),
					),
				});

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionIndex, tx.transactionIndex));

				return {
					tag: "intent_uniswap_v3_mint_v2",
					chain: hexToNumber(block.eth_chainId),
					log_index: hexToNumber(TRANSACTION_EVENT),
					tx_index: hexToNumber(tx.transactionIndex),
					block_number: hexToNumber(block.eth_getBlockByNumber.number),
					block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
					token_1_address: token1,
					token_0_address: token0,
					pool_address: poolAddress,
					fee: numberToHex(params.fee),
					success: getEventSuccess(receipt),
					sender_address: getAddress(tx.from),
					recipient_address: getAddress(params.recipient),
					token_0_minimum_quantity: numberToHex(params.amount0Min),
					token_1_minimum_quantity: numberToHex(params.amount1Min),
					token_0_desired_quantity: numberToHex(params.amount0Desired),
					token_1_desired_quantity: numberToHex(params.amount1Desired),
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
				await client.insert(table).values(events.slice(i, i + MAX_BATCH_SIZE));
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
						events.map((event) => [event.block_timestamp, event.block_number, event.tx_index, event.log_index, event.chain]),
					),
				),
			);
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_tx_index_v4,
	handler: (block) => event.handler(block),
	id: "intent_uniswap_v3_mint_v2_index_block_number_tx_index_v4",
});

univo.event({
	filters: event.filters,
	storage: index_account_v4,
	id: "intent_uniswap_v3_mint_v2_index_account_v4",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event, account: event.pool_address },
				{ event, account: event.sender_address },
				{ event, account: event.token_0_address },
				{ event, account: event.token_1_address },
				{ event, account: event.recipient_address },
			];
		});
	},
});

export async function getIntentUniswapV3MintV2(ids: EventId[]) {
	const filtered = ids.filter((id) => TABLES[id.tag] === TABLES.intent_uniswap_v3_mint_v2);

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
					filtered.map((id) => [id.block_timestamp, id.block_number, id.tx_index, id.log_index, id.chain]),
				),
			),
		)
		.orderBy(asc(table.block_timestamp), asc(table.block_number), asc(table.tx_index), asc(table.log_index), asc(table.chain));

	return rows.map<IntentUniswapV3MintV2>((row) => {
		return {
			tag: "intent_uniswap_v3_mint_v2",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			success: row.success,
			fee: row.fee,
			pool_address: getAddress(row.pool_address),
			sender_address: getAddress(row.sender_address),
			token_0_address: getAddress(row.token_0_address),
			token_1_address: getAddress(row.token_1_address),
			recipient_address: getAddress(row.recipient_address),
			token_0_desired_quantity: row.token_0_desired_quantity,
			token_1_desired_quantity: row.token_1_desired_quantity,
			token_0_minimum_quantity: row.token_0_minimum_quantity,
			token_1_minimum_quantity: row.token_1_minimum_quantity,
		};
	});
}
