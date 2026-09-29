import { and, eq, sql } from "drizzle-orm";
import { integer, pgTable, primaryKey, smallint } from "drizzle-orm/pg-core";

import { logger } from "@/utils";
import type { Id } from "@/events";
import type { Chain } from "@/constants";
import { createPostgresClient } from "@/db/client";
import { REVERSE_TABLES, TABLES, TRANSACTION_EVENT } from "@/constants";

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
// end up in a completely different position when it is included canonically. If a user clicks on a transaction that hasn't
// finalized it should be represented by its unique hash so its safe in the rare case its position changes.

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
	async upsert(ids: Id[]) {
		const unique: Record<string, true> = {};

		const batch: (typeof table.$inferInsert)[] = [];

		for (const id of ids) {
			const key = [id.chain, id.block_number, id.tx_index, id.log_index, id.tag].join(":");

			if (unique[key]) {
				continue;
			}

			unique[key] = true;

			batch.push({
				chain: id.chain,
				tx_index: id.tx_index,
				log_index: id.log_index,
				table_id: TABLES[id.tag],
				block_number: id.block_number,
				block_timestamp: Math.floor(id.block_timestamp.getTime() / 1000),
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

	async delete(ids: Id[]) {
		let chain = undefined;
		let block_number = undefined;

		for (const id of ids) {
			if (chain === undefined) {
				chain = id.chain;
			}

			if (chain !== id.chain) {
				throw new Error("Expected entire batch to be from the same chain");
			}

			if (block_number === undefined) {
				block_number = id.block_number;
			}

			if (block_number !== id.block_number) {
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

export async function getEventIdsForBlockNumber(chain: Chain, block: number) {
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

	return rows.map<Id>((result) => {
		return {
			chain: result.chain,
			tx_index: result.tx_index,
			log_index: result.log_index,
			block_number: result.block_number,
			tag: REVERSE_TABLES[result.table_id],
			block_timestamp: new Date(result.block_timestamp * 1000),
		};
	});
}

export async function getEventIdsForTxPosition(chain: Chain, block: number, tx: number) {
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

	return rows.map<Id>((result) => {
		return {
			chain: result.chain,
			tx_index: result.tx_index,
			log_index: result.log_index,
			block_number: result.block_number,
			tag: REVERSE_TABLES[result.table_id],
			block_timestamp: new Date(result.block_timestamp * 1000),
		};
	});
}
