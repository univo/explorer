import { getAddress } from "viem";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { index, integer, pgTable, smallint } from "drizzle-orm/pg-core";

import { logger } from "@/utils";
import { inTuple, hex } from "@/db/types";
import { createPostgresClient } from "@/db/client";

// This table uses indexes slightly differently than others. Noticably, we use a normal index over both columns as opposed
// to a primary key. This means duplicates are possible and we do not enforce uniqueness. Note the usage of selectDistinct
// in our query to compensate for those duplicates. We do this to reduce the index size. After partitioning by timestamp,
// we reduce the search space so significantly that the any values after that in the index aren't worth including. This
// increases CPU and memory caused by the scan but is a good tradeoff.

// The ordering of the index is very intentional. Interesting when querying this table we always know all four of the indexed
// columns: timestamp (basically a cursor, defaults to current timestamp), account, chain (statically defined), and the table
// id (also statically defined). The most basic query has a timestamp and account, and just uses all chains and all table ids.
// You can the filter for specific events, and on specific chains. We place the timestamp first to maximise inserts because
// timestamps effectively operate as increasing integers which work well with the B-Tree index.

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
		index("index_account_v4_account_block_timestamp_table_id_idx").on(table.block_timestamp, table.account, table.chain, table.table_id), //
	],
);

export const index_account_v4 = {
	async upsert(indexes: Index[]) {
		const unique: Record<string, true> = {};

		const batch: Index[] = [];

		for (const index of indexes) {
			const account = getAddress(index.account);

			const key = [account, index.event_id].join(":");

			if (unique[key]) {
				continue;
			}

			unique[key] = true;

			batch.push({ account, event_id: index.event_id });
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
				[table.account, table.event_id],
				indexes.map((index) => [index.account, index.event_id]),
			),
		);
	},
};

// The index aims to support a few primary query patterns:
//
// 1. Filter events by account, event, and timestamp: if we are looking for an account performing
//    specific events we can filter based on the table id, and provide a timestamp to search within
//    a given time range.
//
// 2. Filter events by account, and event: allows us to get a list of events performed by a given
//	  account using the table id.
//
// All of these query are essentially taking the entire list of events and allow us to filter them for something
// more specific: per account, per event type, and per timestamp. All query patterns should support pagination too.
// We do not support the ability to filter for other addresses, e.g. to answer the a query "has this account interacted
// with this uniswap router", instead we query for the specific events that would involve that contract. This massively
// reduces the search space and cost while achieving a similar outcome

type Pagination = {
	limit: number;
	cursor?: string;
	order: "latest" | "reverse";
};

export async function getEventIdsForAccount(account: `0x${string}`, pagination: Pagination) {
	const start = Date.now();

	const client = await createPostgresClient();

	if (pagination.cursor) {
		const rows = await client
			.selectDistinct({ event_id: table.event_id })
			.from(table)
			.where(and(eq(table.account, account), (pagination.order === "latest" ? lt : gt)(table.event_id, pagination.cursor)))
			.orderBy((pagination.order === "latest" ? desc : asc)(table.event_id))
			.limit(pagination.limit);

		logger.debug(`Found ${rows.length} events for account in ${Date.now() - start}ms`);

		return rows.map((result) => result.event_id);
	}

	const rows = await client
		.selectDistinct({ event_id: table.event_id })
		.from(table)
		.where(eq(table.account, account))
		.orderBy((pagination.order === "latest" ? desc : asc)(table.event_id))
		.limit(pagination.limit);

	logger.debug(`Found ${rows.length} events for account in ${Date.now() - start}ms`);

	return rows.map((result) => result.event_id);
}
