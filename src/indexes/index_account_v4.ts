import { getAddress } from "viem";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { index, integer, pgTable, smallint } from "drizzle-orm/pg-core";

import { logger } from "@/utils";
import type { Event } from "@/events";
import type { Chain } from "@/constants";
import { inTuple, hex } from "@/db/types";
import { createPostgresClient } from "@/db/client";
import { REVERSE_TABLES, TABLES } from "@/constants";

// This table uses indexes slightly differently than others. Noticably, we use a normal index as opposed to a primary key.
// This means duplicates are possible and we do not enforce uniqueness. Note the usage of selectDistinct in our query to
// compensate for those duplicates.

// There are two reasons why we do this: it trades off a reduced storage cost for an increased CPU costs. After partitioning
// by timestamp we reduce the search space so significantly that we can just perform a scan over the remaining values. The
// second reason and slightly more important is that an index can be added after the first backfill. When initialising the
// explorer this massively improves insert performance.

type Index = {
	event: Event;
	account: `0x${string}`;
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

			const key = [
				account,
				index.event.chain,
				index.event.block_timestamp,
				index.event.block_number,
				index.event.tx_index,
				index.event.log_index,
				index.event.tag,
			].join(":");

			if (unique[key]) {
				continue;
			}

			unique[key] = true;

			batch.push({
				account,
				chain: index.event.chain,
				table_id: TABLES[index.event.tag],
				block_timestamp: index.event.block_timestamp.getTime(),

				tx_index: index.event.tx_index,
				log_index: index.event.log_index,
				block_number: index.event.block_number,
			});
		}

		const MAX_BATCH_SIZE = 4000;

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
					return [
						// Indexed columns
						index.account,
						index.event.block_timestamp.getTime(),
						index.event.chain,
						TABLES[index.event.tag],

						// Non-indexed columns
						index.event.tx_index,
						index.event.log_index,
						index.event.block_number,
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
	// Filtering. This _can_ be a computationally expensive operation. The worst case scenario is we perform filtering
	// on a hot account like USDC for a chain or table where no event exists. This is because it will perform a full
	// timeline search (possibly billions of rows) of USDC and never satisfy the pagination limit. To avoid this we
	// should only ever be searching for batches of common events on chains we know the account exists so that our
	// search query returns a in reasonable amount of time.

	chains: Chain[];
	tables: number[];

	// Pagination

	limit: number;
	cursor?: Event;

	// Ordering

	order: "latest" | "reverse";
};

export async function getEventsForAccount(account: `0x${string}`, opts: Opts) {
	const start = Date.now();

	const client = await createPostgresClient();

	if (opts.cursor) {
		const { block_timestamp, block_number, tx_index, log_index, chain, tag } = opts.cursor;

		const table_id = TABLES[tag];

		const cursor =
			opts.order === "latest"
				? sql`(${table.block_timestamp},${table.block_number},${table.tx_index},${table.log_index},${table.chain},${table.table_id}) < (${block_timestamp},${block_number},${tx_index},${log_index},${chain},${table_id})`
				: sql`(${table.block_timestamp},${table.block_number},${table.tx_index},${table.log_index},${table.chain},${table.table_id}) > (${block_timestamp},${block_number},${tx_index},${log_index},${chain},${table_id})`;

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
					inArray(table.table_id, opts.tables),
					cursor,
				),
			)
			.orderBy(
				(opts.order === "latest" ? desc : asc)(table.block_timestamp),
				(opts.order === "latest" ? desc : asc)(table.block_number),
				(opts.order === "latest" ? desc : asc)(table.tx_index),
				(opts.order === "latest" ? desc : asc)(table.log_index),
				(opts.order === "latest" ? desc : asc)(table.chain),
				(opts.order === "latest" ? desc : asc)(table.table_id),
			)
			.limit(opts.limit);

		logger.debug(`Found ${rows.length} events for account in ${Date.now() - start}ms`);

		return rows.map((result) => {
			const tag = REVERSE_TABLES[result.table_id];

			return {
				tag,
				chain: result.chain,
				tx_index: result.tx_index,
				log_index: result.log_index,
				block_number: result.block_number,
				block_timestamp: new Date(result.block_timestamp),
			};
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
				inArray(table.table_id, opts.tables),
			),
		)
		.orderBy(
			(opts.order === "latest" ? desc : asc)(table.block_timestamp),
			(opts.order === "latest" ? desc : asc)(table.block_number),
			(opts.order === "latest" ? desc : asc)(table.tx_index),
			(opts.order === "latest" ? desc : asc)(table.log_index),
			(opts.order === "latest" ? desc : asc)(table.chain),
			(opts.order === "latest" ? desc : asc)(table.table_id),
		)
		.limit(opts.limit);

	logger.debug(`Found ${rows.length} events for account in ${Date.now() - start}ms`);

	return rows.map((result) => {
		const tag = REVERSE_TABLES[result.table_id];

		return {
			tag,
			chain: result.chain,
			tx_index: result.tx_index,
			log_index: result.log_index,
			block_number: result.block_number,
			block_timestamp: new Date(result.block_timestamp),
		};
	});
}
