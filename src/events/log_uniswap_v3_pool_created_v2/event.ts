import { and, asc, inArray } from "drizzle-orm";
import { decodeEventLog, getAddress, hexToNumber, parseAbiItem, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { TABLES } from "@/constants";
import { inTuple } from "@/db/types";
import { createId, parseId } from "@/helpers";
import { createPostgresClient } from "@/db/client";
import { defineLoader, isHexEqual, numberToHex } from "@/utils";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface LogUniswapV3PoolCreatedV2 {
	tag: "log_uniswap_v3_pool_created_v2";
	id: string;
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	fee: number;
	tick_spacing: number;
	pool_address: `0x${string}`;
	token_0_address: `0x${string}`;
	token_1_address: `0x${string}`;
}

export const UNISWAP_V3_FACTORY_DEPLOYED_BLOCK = 12369621;
export const UNISWAP_V3_FACTORY_ADDRESS = getAddress("0x1F98431c8aD98523631AE4a59f267346ea31F984");

const POOL_CREATED_ABI = parseAbiItem(
	"event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
);

export const event = univo.event({
	id: "log_uniswap_v3_pool_created_v2",

	filters: [
		{
			chain: 1,
			address: UNISWAP_V3_FACTORY_ADDRESS,
			event: toEventSelector(POOL_CREATED_ABI),
			fromBlock: UNISWAP_V3_FACTORY_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockReceipts.flatMap((receipt) => {
			return receipt.logs.flatMap<LogUniswapV3PoolCreatedV2>((log) => {
				try {
					if (!isHexEqual(log.address, UNISWAP_V3_FACTORY_ADDRESS)) {
						return [];
					}

					if (!isHexEqual(log.topics[0], toEventSelector(POOL_CREATED_ABI))) {
						return [];
					}

					const { args } = decodeEventLog({
						strict: true,
						data: log.data,
						topics: log.topics,
						abi: [POOL_CREATED_ABI],
					});

					const id = createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: TABLES.log_uniswap_v3_pool_created_v2,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					return {
						tag: "log_uniswap_v3_pool_created_v2",
						id,
						log_index: hexToNumber(log.logIndex),
						chain: hexToNumber(block.eth_chainId),
						tx_index: hexToNumber(log.transactionIndex),
						block_number: hexToNumber(block.eth_getBlockByNumber.number),
						block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
						fee: args.fee,
						tick_spacing: args.tickSpacing,
						pool_address: getAddress(args.pool),
						token_0_address: getAddress(args.token0),
						token_1_address: getAddress(args.token1),
					};
				} catch {
					return [];
				}
			});
		});
	},

	storage: {
		async upsert(events) {
			const MAX_BATCH_SIZE = 8000;
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
	id: "log_uniswap_v3_pool_created_v2_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

export async function getLogUniswapV3PoolCreatedV2(ids: string[]) {
	const mapped = ids.map((id) => parseId(id));
	const filtered = mapped.filter((id) => id.tableId === TABLES.log_uniswap_v3_pool_created_v2);

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
					filtered.map((event) => new Date(event.blockTimestamp * 1000)),
				),
				inTuple(
					[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
					filtered.map((event) => [new Date(event.blockTimestamp * 1000), event.blockNumber, event.txIndex, event.logIndex, event.chainId]),
				),
			),
		)
		.orderBy(asc(table.block_timestamp), asc(table.block_number), asc(table.tx_index), asc(table.log_index), asc(table.chain));

	return rows.map((row) => {
		const id = createId({
			chainId: numberToHex(row.chain),
			txIndex: numberToHex(row.tx_index),
			tableId: TABLES.log_uniswap_v3_pool_created_v2,
			logIndex: numberToHex(row.log_index),
			blockNumber: numberToHex(row.block_number),
			blockTimestamp: numberToHex(row.block_timestamp.getTime() / 1000),
		});

		return {
			tag: "log_uniswap_v3_pool_created_v2",
			id,
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			fee: row.fee,
			tick_spacing: row.tick_spacing,
			pool_address: getAddress(row.pool_address),
			token_0_address: getAddress(row.token_0_address),
			token_1_address: getAddress(row.token_1_address),
		};
	});
}

export const getPoolByAddress = defineLoader(async (pools: readonly `0x${string}`[]) => {
	if (pools.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.selectDistinct() //
		.from(table)
		.where(inArray(table.pool_address, pools));

	return pools.map<LogUniswapV3PoolCreatedV2 | null>((pool) => {
		const row = rows.find((row) => isHexEqual(row.pool_address, pool));

		if (row === undefined) {
			return null;
		}

		const id = createId({
			chainId: numberToHex(row.chain),
			txIndex: numberToHex(row.tx_index),
			tableId: TABLES.log_uniswap_v3_pool_created_v2,
			logIndex: numberToHex(row.log_index),
			blockNumber: numberToHex(row.block_number),
			blockTimestamp: numberToHex(row.block_timestamp.getTime() / 1000),
		});

		return {
			tag: "log_uniswap_v3_pool_created_v2",
			id,
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			fee: row.fee,
			tick_spacing: row.tick_spacing,
			pool_address: getAddress(row.pool_address),
			token_0_address: getAddress(row.token_0_address),
			token_1_address: getAddress(row.token_1_address),
		};
	});
});
