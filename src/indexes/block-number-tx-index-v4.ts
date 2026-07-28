import { and, eq, sql } from "drizzle-orm";
import { integer, pgTable, primaryKey, smallint } from "drizzle-orm/pg-core";

import type { Chain } from "@/constants";
import { createId, parseId } from "@/helpers";
import { logger, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";

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
	async upsert(ids: string[]) {
		const unique: Record<string, true> = {};

		const batch: (typeof table.$inferInsert)[] = [];

		for (const id of ids) {
			const parsed = parseId(id);

			const key = [parsed.chainId, parsed.blockNumber, parsed.txIndex, parsed.logIndex, parsed.tableId].join(":");

			if (unique[key]) {
				continue;
			}

			unique[key] = true;

			batch.push({
				chain: parsed.chainId,
				tx_index: parsed.txIndex,
				table_id: parsed.tableId,
				log_index: parsed.logIndex,
				block_number: parsed.blockNumber,
				block_timestamp: parsed.blockTimestamp,
			});
		}

		const MAX_BATCH_SIZE = 8000;

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

	async delete(ids: string[]) {
		let chain = undefined;
		let block_number = undefined;

		for (const id of ids) {
			const parsed = parseId(id);

			if (chain === undefined) {
				chain = parsed.chainId;
			}

			if (chain !== parsed.chainId) {
				throw new Error("Expected entire batch to be from the same chain");
			}

			if (block_number === undefined) {
				block_number = parsed.blockNumber;
			}

			if (block_number !== parsed.blockNumber) {
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
		.where(and(eq(table.chain, chain), eq(table.block_number, block)));

	logger.debug(`Found ${rows.length} events for block in ${Date.now() - start}ms`);

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

export async function getEventIdsForTxPosition(chain: Chain, block: number, tx: number) {
	const start = Date.now();

	const client = await createPostgresClient();

	const rows = await client
		.select()
		.from(table)
		.where(and(eq(table.chain, chain), eq(table.block_number, block), eq(table.tx_index, tx)));

	logger.debug(`Found ${rows.length} events for block in ${Date.now() - start}ms`);

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
