import { db } from "@/db/client";
import { logger } from "@/utils";
import type { chains } from "@/constants";
import { getInternalChain, parseId } from "@/helpers";

// TODO
// Remove after new block-number-tx-index index is live

// Is it smarter to create a block number index table for each chain rather than adding a chain field?
// Clickhouse benefits greatly from append only tables and using the chain for ordering would mean inserts
// happen at places other than the end of the table. Claude said this won't really be a problem in practice
// and I am inclined to believe it.

// CREATE TABLE index_block_number_v2 (
//	   `chain` UInt16,
//     `block_number` UInt64,
//     `event_id` FixedString(36)
// )
// ENGINE = ReplacingMergeTree
// ORDER BY (chain, block_number, event_id);

export const index_block_number_v2 = {
	async upsert(indexes: { id: string; block_number: number }[]) {
		const unique: Record<string, true> = {};
		const values: { chain: number; block_number: number; event_id: string }[] = [];

		for (const index of indexes) {
			if (unique[index.block_number + index.id]) continue;

			const external_chain = parseId(index.id).chain_id;
			const internal_chain = getInternalChain(external_chain);

			values.push({
				chain: internal_chain,
				block_number: index.block_number,
				event_id: index.id,
			});

			unique[index.block_number + index.id] = true;
		}

		await db.insert({ table: "index_block_number_v2", format: "JSONEachRow", values });
	},
};

export async function getEventIdsForBlockNumber(chain: keyof typeof chains, block_number: number) {
	const start = Date.now();

	const res = await db.query({
		query: `SELECT event_id FROM index_block_number_v2 WHERE chain = ${chain} AND block_number = ${block_number};`,
		format: "JSONEachRow",
	});

	const rows: Record<string, string>[] = await res.json();
	logger.debug(`Found ${rows.length} events for index_block_number_v2 in ${Date.now() - start}ms`);

	return rows.map((row) => row.event_id) as string[];
}
