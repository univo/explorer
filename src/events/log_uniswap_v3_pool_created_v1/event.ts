import { asc, inArray, sql } from "drizzle-orm";
import { decodeEventLog, getAddress, parseAbiItem, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { TABLES } from "@/constants";
import { defineBatchLoader, isHexEqual } from "@/utils";
import { createId, parseId } from "@/helpers";
import { createPostgresClient } from "@/db/client";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface LogUniswapV3PoolCreatedV1 {
	tag: "log_uniswap_v3_pool_created_v1";
	id: string;
	success: true;
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
	id: "log_uniswap_v3_pool_created_v1",

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
			return receipt.logs.flatMap((log) => {
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
						tableId: TABLES.log_uniswap_v3_pool_created_v1,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					return {
						id,
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
							fee: sql.raw(`excluded.${table.fee.name}`),
							pool_address: sql.raw(`excluded.${table.pool_address.name}`),
							tick_spacing: sql.raw(`excluded.${table.tick_spacing.name}`),
							token_0_address: sql.raw(`excluded.${table.token_0_address.name}`),
							token_1_address: sql.raw(`excluded.${table.token_1_address.name}`),
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
	id: "log_uniswap_v3_pool_created_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

export async function getLogUniswapV3PoolCreatedV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.log_uniswap_v3_pool_created_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<LogUniswapV3PoolCreatedV1>((result) => {
		return {
			tag: "log_uniswap_v3_pool_created_v1",
			id: result.id,
			success: true,
			fee: result.fee,
			tick_spacing: result.tick_spacing,
			pool_address: getAddress(result.pool_address),
			token_0_address: getAddress(result.token_0_address),
			token_1_address: getAddress(result.token_1_address),
		};
	});
}

export const getPoolByAddress = defineBatchLoader(async (pools: readonly `0x${string}`[]) => {
	if (pools.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.pool_address, pools));

	return pools.map<LogUniswapV3PoolCreatedV1 | null>((pool) => {
		const result = rows.find((row) => isHexEqual(row.pool_address, pool));

		if (result === undefined) {
			return null;
		}

		return {
			tag: "log_uniswap_v3_pool_created_v1",
			id: result.id,
			success: true,
			fee: result.fee,
			tick_spacing: result.tick_spacing,
			pool_address: getAddress(result.pool_address),
			token_0_address: getAddress(result.token_0_address),
			token_1_address: getAddress(result.token_1_address),
		};
	});
});
