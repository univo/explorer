import { getAddress } from "viem";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { index, integer, pgTable, smallint } from "drizzle-orm/pg-core";

import { TABLES } from "@/constants";
import { inTuple, hex } from "@/db/types";
import { logger, numberToHex } from "@/utils";
import { createId, parseId } from "@/helpers";
import type { Chain, Table } from "@/constants";
import { createPostgresClient } from "@/db/client";

// This table uses indexes slightly differently than others. Noticably, we use a normal index as opposed to a primary key.
// This means duplicates are possible and we do not enforce uniqueness. Note the usage of selectDistinct in our query to
// compensate for those duplicates.

// There are two reasons why we do this: it trades off a reduced storage costs for a increased CPU costs. After partitioning
// by timestamp we reduce the search space so significantly that we can just perform a scan over the remaining values. The
// second reason and slightly more important is that an index can be added after the first backfill. When initialising the
// explorer this massively improves insert performance.

type Index = {
	account: `0x${string}`;
	event_id: string;
};

export const table = pgTable(
	"index_account_v4",
	{
		// Indexed columns
		account: hex().notNull(),
		chain: smallint().notNull(),
		table_id: smallint().notNull(),
		block_timestamp: integer().notNull(),

		// Non-indexed columns
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
	},
	(table) => [
		index("index_account_v4_timeline_idx").on(
			table.account, //
			table.block_timestamp,
			table.chain,
			table.table_id,
		),
	],
);

// TODO: To include all chains and all tables, we can do "not in empty array"?

export const index_account_v4 = {
	async upsert(indexes: Index[]) {
		const unique: Record<string, true> = {};

		const batch: (typeof table.$inferInsert)[] = [];

		for (const index of indexes) {
			const account = getAddress(index.account);

			const key = [account, index.event_id].join(":");

			if (unique[key]) {
				continue;
			}

			unique[key] = true;

			const parsed = parseId(index.event_id);

			batch.push({
				account,
				chain: parsed.chainId,
				table_id: parsed.tableId,
				block_timestamp: parsed.blockTimestamp,

				tx_index: parsed.txIndex,
				log_index: parsed.logIndex,
				block_number: parsed.blockNumber,
			});
		}

		const MAX_BATCH_SIZE = 8000;

		const client = await createPostgresClient();

		for (let i = 0; i < batch.length; i += MAX_BATCH_SIZE) {
			await client.insert(table).values(batch.slice(i, i + MAX_BATCH_SIZE));
		}
	},

	async delete(indexes: Index[]) {
		const client = await createPostgresClient();

		await client.delete(table).where(
			inTuple(
				[
					// Indexed columns
					table.account,
					table.block_timestamp,
					table.chain,
					table.table_id,

					// Non-indexed columns
					table.tx_index,
					table.log_index,
					table.block_number,
				],
				indexes.map((index) => {
					const parsed = parseId(index.event_id);

					return [
						// Indexed columns
						index.account,
						parsed.blockTimestamp,
						parsed.chainId,
						parsed.tableId,

						// Non-indexed columns
						parsed.txIndex,
						parsed.logIndex,
						parsed.blockNumber,
					];
				}),
			),
		);
	},
};

// All of these query are essentially taking the entire list of events and filter on some condition: either we filter
// for specific chains, specific events, or a specific time.

// Note that we intentionally do not support the ability to filter for addresses - e.g. to answer a query "has
// this account interacted with the Uniswap router" - and instead resort to querying for specific intents or log events
// involving that contract. This massively reduces search costs while achieving a similar outcome.

type Opts = {
	/** Filter for specific chains */
	chains: Chain[];

	/** Filter for specific events */
	events: Table[];

	/** Pagination limit */
	limit: number;

	/** Pagination cursor */
	cursor?: string;

	/** Sort ordering */
	order: "latest" | "reverse";
};

export async function getEventIdsForAccount(account: `0x${string}`, opts: Opts) {
	const start = Date.now();

	const client = await createPostgresClient();

	const tableIds = opts.events.map((key) => TABLES[key]);

	// If two events have the same block timestamp, block number, tx index and log index it will
	// create non-deterministic ordering that breaks pagination. In practice though, the chance of
	// this happening between chains is too rare for me to care.

	if (opts.cursor) {
		const { blockTimestamp, blockNumber, txIndex, logIndex } = parseId(opts.cursor);

		const cursor = sql`
			(${table.block_timestamp},${table.block_number},${table.tx_index},${table.log_index}) 
			${opts.order === "latest" ? "<" : ">"} 
			(${blockTimestamp},${blockNumber},${txIndex},${logIndex})
		`;

		const rows = await client
			.selectDistinct({
				chain: table.chain,
				table_id: table.table_id,
				block_timestamp: table.block_timestamp,

				tx_index: table.tx_index,
				log_index: table.log_index,
				block_number: table.block_number,
			})
			.from(table)
			.where(
				and(
					eq(table.account, account), //
					inArray(table.chain, opts.chains),
					inArray(table.table_id, tableIds),
					cursor,
				),
			)
			.orderBy(
				(opts.order === "latest" ? desc : asc)(table.block_timestamp),
				(opts.order === "latest" ? desc : asc)(table.block_number),
				(opts.order === "latest" ? desc : asc)(table.tx_index),
				(opts.order === "latest" ? desc : asc)(table.log_index),
			)
			.limit(opts.limit);

		logger.debug(`Found ${rows.length} events for account in ${Date.now() - start}ms`);

		return rows.map((result) => {
			return createId({
				tableId: result.table_id,
				chainId: numberToHex(result.chain),
				txIndex: numberToHex(result.tx_index),
				logIndex: numberToHex(result.log_index),
				blockNumber: numberToHex(result.block_number),
				blockTimestamp: numberToHex(result.block_timestamp),
			});
		});
	}

	const rows = await client
		.selectDistinct({
			chain: table.chain,
			table_id: table.table_id,
			block_timestamp: table.block_timestamp,

			tx_index: table.tx_index,
			log_index: table.log_index,
			block_number: table.block_number,
		})
		.from(table)
		.where(
			and(
				eq(table.account, account), //
				inArray(table.chain, opts.chains),
				inArray(table.table_id, tableIds),
			),
		)
		.orderBy(
			(opts.order === "latest" ? desc : asc)(table.block_timestamp),
			(opts.order === "latest" ? desc : asc)(table.block_number),
			(opts.order === "latest" ? desc : asc)(table.tx_index),
			(opts.order === "latest" ? desc : asc)(table.log_index),
		)
		.limit(opts.limit);

	logger.debug(`Found ${rows.length} events for account in ${Date.now() - start}ms`);

	return rows.map((result) => {
		return createId({
			tableId: result.table_id,
			chainId: numberToHex(result.chain),
			txIndex: numberToHex(result.tx_index),
			logIndex: numberToHex(result.log_index),
			blockNumber: numberToHex(result.block_number),
			blockTimestamp: numberToHex(result.block_timestamp),
		});
	});
}
