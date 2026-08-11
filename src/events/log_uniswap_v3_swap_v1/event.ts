import { asc, inArray, sql } from "drizzle-orm";
import { decodeEventLog, getAddress, parseAbiItem, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { TABLES } from "@/constants";
import { isHexEqual } from "@/utils";
import { createId, parseId } from "@/helpers";
import { createPostgresClient } from "@/db/client";
import { UNISWAP_V3_FACTORY_DEPLOYED_BLOCK } from "@/events/log_uniswap_v3_pool_created_v1/event";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface LogUniswapV3SwapV1 {
	tag: "log_uniswap_v3_swap_v1";
	id: string;
	success: true;
	tick: number;
	amount_0: bigint;
	amount_1: bigint;
	liquidity: bigint;
	sqrt_price_x96: bigint;
	pool_address: `0x${string}`;
	sender_address: `0x${string}`;
	recipient_address: `0x${string}`;
}

const SWAP_ABI = parseAbiItem(
	"event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
);

export const event = univo.event({
	id: "log_uniswap_v3_swap_v1",

	filters: [
		{
			chain: 1,
			event: toEventSelector(SWAP_ABI),
			fromBlock: UNISWAP_V3_FACTORY_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockReceipts.flatMap((receipt) => {
			return receipt.logs.flatMap((log) => {
				try {
					if (!isHexEqual(log.topics[0], toEventSelector(SWAP_ABI))) {
						return [];
					}

					const { args } = decodeEventLog({
						strict: true,
						data: log.data,
						abi: [SWAP_ABI],
						topics: log.topics,
					});

					const id = createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: TABLES.log_uniswap_v3_swap_v1,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					return {
						id,
						tick: args.tick,
						amount_0: args.amount0,
						amount_1: args.amount1,
						liquidity: args.liquidity,
						sqrt_price_x96: args.sqrtPriceX96,
						pool_address: getAddress(log.address),
						sender_address: getAddress(args.sender),
						recipient_address: getAddress(args.recipient),
					};
				} catch {
					return [];
				}
			});
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
							tick: sql.raw(`excluded.${table.tick.name}`),
							amount_0: sql.raw(`excluded.${table.amount_0.name}`),
							amount_1: sql.raw(`excluded.${table.amount_1.name}`),
							liquidity: sql.raw(`excluded.${table.liquidity.name}`),
							pool_address: sql.raw(`excluded.${table.pool_address.name}`),
							sender_address: sql.raw(`excluded.${table.sender_address.name}`),
							sqrt_price_x96: sql.raw(`excluded.${table.sqrt_price_x96.name}`),
							recipient_address: sql.raw(`excluded.${table.recipient_address.name}`),
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
	id: "log_uniswap_v3_swap_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

export async function getLogUniswapV3SwapV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.log_uniswap_v3_swap_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<LogUniswapV3SwapV1>((result) => {
		return {
			tag: "log_uniswap_v3_swap_v1",
			id: result.id,
			success: true,
			tick: result.tick,
			amount_0: result.amount_0,
			amount_1: result.amount_1,
			liquidity: result.liquidity,
			sqrt_price_x96: result.sqrt_price_x96,
			pool_address: getAddress(result.pool_address),
			sender_address: getAddress(result.sender_address),
			recipient_address: getAddress(result.recipient_address),
		};
	});
}
