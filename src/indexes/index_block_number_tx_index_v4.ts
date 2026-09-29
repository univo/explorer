import { and, eq, sql } from "drizzle-orm";
import { integer, pgTable, primaryKey, smallint } from "drizzle-orm/pg-core";

import { logger } from "@/utils";
import type { Event } from "@/events";
import type { Chain } from "@/constants";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";

// Transactions can be uniquely represented in two ways: their transaction hash, or the combination of their block number
// and transaction index. In general, the explorer uses the latter and there are a few reasons why:
//
// - Storage cost. The latter is requires much less storage to implement. So much so that we actually use that id inside of
//   our event identifiers. This is what allows users to click an event id and for us to understand what transaction it
//   originated from without having to consult any other source.
//
// - Covered index. The same index can used to look up events from a given block number.
//
// The tradeoff here is that this representation fails under chain reorganisations. A transaction in a reorganised block can
// end up in a completely different position when it is included canonically.

export const table = pgTable(
	"index_block_number_tx_index_v4",
	{
		chain: smallint().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		table_id: smallint().notNull(),
		block_number: integer().notNull(),
		block_timestamp: integer().notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.chain, table.block_number, table.tx_index, table.log_index, table.table_id],
		}),
	],
);

export const index_block_number_tx_index_v4 = {
	async upsert(events: Event[]) {
		const unique: Record<string, true> = {};

		const batch: (typeof table.$inferInsert)[] = [];

		for (const event of events) {
			const key = [event.chain, event.block_number, event.tx_index, event.log_index, event.tag].join(":");

			if (unique[key]) {
				continue;
			}

			unique[key] = true;

			batch.push({
				chain: event.chain,
				tx_index: event.tx_index,
				log_index: event.log_index,
				table_id: TABLES[event.tag],
				block_number: event.block_number,
				block_timestamp: event.block_timestamp.getTime(),
			});
		}

		const MAX_BATCH_SIZE = 4000;

		const client = await createPostgresClient();

		for (let i = 0; i < batch.length; i += MAX_BATCH_SIZE) {
			await client
				.insert(table)
				.values(batch.slice(i, i + MAX_BATCH_SIZE))
				.onConflictDoUpdate({
					target: [table.chain, table.block_number, table.tx_index, table.log_index, table.table_id],
					set: { block_timestamp: sql.raw(`excluded.${table.block_timestamp.name}`) },
				});
		}
	},

	async delete(events: Event[]) {
		let chain = undefined;
		let block_number = undefined;

		for (const event of events) {
			if (chain === undefined) {
				chain = event.chain;
			}

			if (chain !== event.chain) {
				throw new Error("Expected entire batch to be from the same chain");
			}

			if (block_number === undefined) {
				block_number = event.block_number;
			}

			if (block_number !== event.block_number) {
				throw new Error("Expected entire batch to be from the same block number");
			}
		}

		if (chain === undefined || block_number === undefined) {
			throw new Error("Expected at least one index");
		}

		const client = await createPostgresClient();

		await client.delete(table).where(and(eq(table.chain, chain), eq(table.block_number, block_number)));
	},
};

export async function getEventsForBlockNumber(chain: Chain, block: number) {
	const start = Date.now();

	const client = await createPostgresClient();

	const rows = await client
		.select()
		.from(table)
		.where(
			and(
				eq(table.chain, chain), //
				eq(table.block_number, block),
				eq(table.log_index, Number(TRANSACTION_EVENT)),
			),
		);

	logger.debug(`Found ${rows.length} events for block in ${Date.now() - start}ms`);

	return rows.map<Event>((result) => {
		const tag = TABLES[result.table_id];

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

export async function getEventsForTxPosition(chain: Chain, block: number, tx: number) {
	const start = Date.now();

	const client = await createPostgresClient();

	const rows = await client
		.select()
		.from(table)
		.where(
			and(
				eq(table.chain, chain), //
				eq(table.block_number, block),
				eq(table.tx_index, tx),
			),
		);

	logger.debug(`Found ${rows.length} events for block in ${Date.now() - start}ms`);

	return rows.map<Event>((result) => {
		const tag = TABLES[result.table_id];

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
