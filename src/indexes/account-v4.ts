import { getAddress } from "viem";
import { index, integer, pgTable, smallint } from "drizzle-orm/pg-core";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";

import { logger } from "@/utils";
import { inTuple, hex } from "@/db/types";
import { createPostgresClient } from "@/db/client";

// Account indexes do not include a chain intentionally. For now, it is preferred that the list of events returned for
// a given account should be multichain by default. This allows us to easily see the actions of specific accounts across
// chains within a similar time-frame.

// This table uses indexes slightly differently than others. Noticably, we use a normal index over both columns as opposed
// to a primary key. This means duplicates are possible and we do not enforce uniqueness. Note the usage of selectDistinct
// in our query to compensate for those duplicates.

// The reason our indexes are designed like this is a tradeoff to maximise backfill performance. This table is the most
// expensive to write to by a substantial margin, primarily because every insert can cause an update at any point in the
// B-Tree index. This causes a higher number of page splits as Postgres attempts to balance the B-Tree, massively reducing
// throughput on the table. This article https://planetscale.com/blog/the-problem-with-using-a-uuid-primary-key-in-mysql
// explains what's going on. All the other tables use some type of timestamp as the primary key and don't suffer from this
// issue. Long-term the solution is to partition based on the account and use the event_id as the sort key. This would allow
// us to achieve the same performance as the other tables, but right now Postgres isn't great at this.

// When backfilling all the data for this table the first time, it is advised to delete the index first. This maximises
// insert performance. After the backfill is complete, manually create the index.

type Index = {
	account: `0x${string}`;
	event_id: string;
};

export const table = pgTable(
	"index_account_v4",
	{
		// Indexed columns
		account: hex().notNull(),
		table_id: smallint().notNull(),
		block_timestamp: integer().notNull(),

		// Non-indexed columns
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		block_number: integer().notNull(),
	},
	(table) => [
		index("index_account_v4_account_block_timestamp_table_id_idx").on(table.account, table.table_id, table.block_timestamp), //
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
