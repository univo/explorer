import { defineEvent } from "univo";
import { and, asc, inArray } from "drizzle-orm";
import { decodeEventLog, getAddress, hexToNumber, parseAbiItem, toEventSelector } from "viem";

import { table } from "./table";
import type { Id } from "@/events";
import { TABLES } from "@/constants";
import { inTuple } from "@/db/types";
import type { Chain } from "@/constants";
import { createPostgresClient } from "@/db/client";
import { defineLoader, isHexEqual } from "@/utils";
import { getChain, getExternalChain, getInternalChain } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface LogUniswapV3PoolCreatedV2 {
	tag: "log_uniswap_v3_pool_created_v2";
	chain: Chain;
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
export const UNISWAP_V3_ARBITRUM_FACTORY_DEPLOYED_BLOCK = 165;
export const UNISWAP_V3_BASE_FACTORY_DEPLOYED_BLOCK = 1371680;
export const UNISWAP_V3_BASE_FACTORY_ADDRESS = getAddress("0x33128a8fC17869897dcE68Ed026d694621f6FDfD");

// Ethereum and Arbitrum use v3-core@1.0.0 at this address:
// https://docs.uniswap.org/contracts/v3/reference/deployments/arbitrum-deployments
export const UNISWAP_V3_FACTORY_ADDRESS = getAddress("0x1F98431c8aD98523631AE4a59f267346ea31F984");

export function getUniswapV3FactoryAddress(chain: Chain) {
	return chain === 8453 ? UNISWAP_V3_BASE_FACTORY_ADDRESS : UNISWAP_V3_FACTORY_ADDRESS;
}

const POOL_CREATED_ABI = parseAbiItem(
	"event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
);

const POOL_CREATED_SELECTOR = toEventSelector(POOL_CREATED_ABI);

export const event = defineEvent({
	id: "log_uniswap_v3_pool_created_v2",

	filters: [
		{
			chain: 1,
			event: POOL_CREATED_SELECTOR,
			address: UNISWAP_V3_FACTORY_ADDRESS,
			fromBlock: UNISWAP_V3_FACTORY_DEPLOYED_BLOCK,
		},
		{
			chain: 42161,
			event: POOL_CREATED_SELECTOR,
			address: UNISWAP_V3_FACTORY_ADDRESS,
			fromBlock: UNISWAP_V3_ARBITRUM_FACTORY_DEPLOYED_BLOCK,
		},
		{
			chain: 8453,
			event: POOL_CREATED_SELECTOR,
			address: UNISWAP_V3_BASE_FACTORY_ADDRESS,
			fromBlock: UNISWAP_V3_BASE_FACTORY_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockReceipts.flatMap((receipt) => {
			return receipt.logs.flatMap<LogUniswapV3PoolCreatedV2>((log) => {
				try {
					if (!isHexEqual(log.address, getUniswapV3FactoryAddress(getChain(block.eth_chainId)))) {
						return [];
					}

					if (!isHexEqual(log.topics[0], POOL_CREATED_SELECTOR)) {
						return [];
					}

					const { args } = decodeEventLog({
						strict: true,
						data: log.data,
						topics: log.topics,
						abi: [POOL_CREATED_ABI],
					});

					return {
						tag: "log_uniswap_v3_pool_created_v2",
						log_index: hexToNumber(log.logIndex),
						chain: getChain(block.eth_chainId),
						tx_index: hexToNumber(receipt.transactionIndex),
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

export const log_uniswap_v3_pool_created_v2_index_block_number_tx_index_v4 = defineEvent({
	filters: event.filters,
	storage: index_block_number_tx_index_v4,
	handler: (block) => event.handler(block),
	id: "log_uniswap_v3_pool_created_v2_index_block_number_tx_index_v4",
});

export async function getLogUniswapV3PoolCreatedV2(ids: Id[]) {
	const filtered = ids.filter((id) => TABLES[id.tag] === TABLES.log_uniswap_v3_pool_created_v2);

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

	return rows.map<LogUniswapV3PoolCreatedV2>((row) => {
		return {
			tag: "log_uniswap_v3_pool_created_v2",
			chain: getExternalChain(row.chain),
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

		return {
			tag: "log_uniswap_v3_pool_created_v2",
			chain: getExternalChain(row.chain),
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
