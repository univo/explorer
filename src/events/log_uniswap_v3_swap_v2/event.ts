import { and, asc, inArray } from "drizzle-orm";
import { decodeEventLog, getAddress, hexToNumber, parseAbiItem, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { TABLES } from "@/constants";
import { inTuple } from "@/db/types";
import { isHexEqual } from "@/utils";
import type { EventId } from "@/events";
import { createPostgresClient } from "@/db/client";
import { UNISWAP_V3_FACTORY_DEPLOYED_BLOCK } from "@/events/log_uniswap_v3_pool_created_v2/event";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface LogUniswapV3SwapV2 {
	tag: "log_uniswap_v3_swap_v2";
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
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
	id: "log_uniswap_v3_swap_v2",

	filters: [
		{
			chain: 1,
			event: toEventSelector(SWAP_ABI),
			fromBlock: UNISWAP_V3_FACTORY_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockReceipts.flatMap((receipt) => {
			return receipt.logs.flatMap<LogUniswapV3SwapV2>((log) => {
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

					return {
						tag: "log_uniswap_v3_swap_v2",
						log_index: hexToNumber(log.logIndex),
						chain: hexToNumber(block.eth_chainId),
						tx_index: hexToNumber(log.transactionIndex),
						block_number: hexToNumber(block.eth_getBlockByNumber.number),
						block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
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
	id: "log_uniswap_v3_swap_v2_index_block_number_tx_index_v4",
});

export async function getLogUniswapV3SwapV2(ids: EventId[]) {
	const filtered = ids.filter((id) => TABLES[id.tag] === TABLES.log_uniswap_v3_swap_v2);

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

	return rows.map<LogUniswapV3SwapV2>((row) => {
		return {
			tag: "log_uniswap_v3_swap_v2",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			tick: row.tick,
			amount_0: row.amount_0,
			amount_1: row.amount_1,
			liquidity: row.liquidity,
			sqrt_price_x96: row.sqrt_price_x96,
			pool_address: getAddress(row.pool_address),
			sender_address: getAddress(row.sender_address),
			recipient_address: getAddress(row.recipient_address),
		};
	});
}
