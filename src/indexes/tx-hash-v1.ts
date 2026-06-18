import { db } from "@/db/client";
import { logger } from "@/utils";

// TODO
// Remove after new block-number-tx-index index is live

// The transactions index does not include a chain id intentionally. For now, transactions are unique enough across chains
// that we can combine this information in the same table. This also means that users do not have to specify the chain id
// for their transaction in anyway.

// CREATE TABLE index_tx_hash_v1 (
//     `tx_hash` FixedString(66),
//     `event_id` FixedString(36)
// )
// ENGINE = ReplacingMergeTree
// ORDER BY (tx_hash, event_id);

export const index_tx_hash_v1 = {
	async upsert(indexes: { id: string; tx_hash: string }[]) {
		const unique: Record<string, true> = {};
		const values: { tx_hash: string; event_id: string }[] = [];

		for (const index of indexes) {
			if (unique[index.tx_hash + index.id]) continue;
			values.push({ tx_hash: index.tx_hash, event_id: index.id });
			unique[index.tx_hash + index.id] = true;
		}

		await db.insert({ table: "index_tx_hash_v1", format: "JSONEachRow", values });
	},
};

export async function getEventIdsForTxHash(tx_hash: `0x${string}`) {
	const start = Date.now();

	const res = await db.query({
		query: `SELECT event_id FROM index_tx_hash_v1 WHERE tx_hash = '${tx_hash}';`,
		format: "JSONEachRow",
	});

	const rows: Record<string, string>[] = await res.json();
	logger.debug(`Found ${rows.length} events for index_tx_hash_v1 in ${Date.now() - start}ms`);

	return rows.map((row) => row.event_id) as string[];
}
