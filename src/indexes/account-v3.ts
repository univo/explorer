import { getAddress } from "viem";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { pgTable, primaryKey } from "drizzle-orm/pg-core";

import { logger } from "@/utils";
import { inTuple, hex, id } from "@/db/types";
import { createPostgresClient } from "@/db/client";

// Account indexes do not include a chain intentionally. For now, it is preferred that the list of events returned for
// a given account should be multichain by default. This allows us to easily see the actions of specific accounts across
// chains within a similar time-frame.

type Index = {
	account: `0x${string}`;
	event_id: string;
};

export const table = pgTable(
	"index_account_v3",
	{
		account: hex().notNull(),
		event_id: id().notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.account, table.event_id],
		}),
	],
);

export const index_account_v3 = {
	async upsert(indexes: Index[]) {
		const unique: Record<string, true> = {};

		const batch: Index[] = [];

		for (const index of indexes) {
			const key = [index.account, index.event_id].join(":");

			if (unique[key]) {
				continue;
			}

			unique[key] = true;

			batch.push({
				account: getAddress(index.account),
				event_id: index.event_id,
			});
		}

		const MAX_BATCH_SIZE = 8000;

		const client = await createPostgresClient();

		for (let i = 0; i < batch.length; i += MAX_BATCH_SIZE) {
			await client
				.insert(table)
				.values(batch.slice(i, i + MAX_BATCH_SIZE))
				.onConflictDoNothing();
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
			.select({ event_id: table.event_id })
			.from(table)
			.where(
				and(eq(table.account, account), (pagination.order === "latest" ? lt : gt)(table.event_id, pagination.cursor)),
			)
			.orderBy((pagination.order === "latest" ? desc : asc)(table.event_id))
			.limit(pagination.limit);

		logger.debug(`Found ${rows.length} events for account in ${Date.now() - start}ms`);

		return rows.map((result) => result.event_id);
	}

	const rows = await client
		.select({ event_id: table.event_id })
		.from(table)
		.where(eq(table.account, account))
		.orderBy((pagination.order === "latest" ? desc : asc)(table.event_id))
		.limit(pagination.limit);

	logger.debug(`Found ${rows.length} events for account in ${Date.now() - start}ms`);

	return rows.map((result) => result.event_id);
}
