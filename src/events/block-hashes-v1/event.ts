import { db } from "@/db/client";
import { univo } from "@/lib/univo";

// CREATE TABLE kv_block_hashes_v1 (
//     `block_number` UInt64,
//     `block_hash` FixedString(66),
//     `created_at` DateTime64(3)
// )
// ENGINE = ReplacingMergeTree(created_at)
// ORDER BY block_hash;

univo.event({
	id: "block_hashes_v1",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return [
			{
				block_hash: block.eth_getBlockByHash.hash,
				block_number: Number(block.eth_getBlockByHash.number),
				created_at: Number(block.eth_getBlockByHash.timestamp) * 1000,
			},
		];
	},

	storage: {
		async upsert(batch) {
			await db.insert({
				table: "kv_block_hashes_v1",
				format: "JSONEachRow",
				values: batch.map((value) => ({
					block_hash: value.block_hash,
					block_number: value.block_number,
					created_at: value.created_at,
				})),
			});
		},
	},
});

export async function getBlockNumber(opts: { block_hash: string }) {
	const res = await db.query({
		query: `SELECT block_number FROM kv_block_hashes_v1 WHERE block_hash = '${opts.block_hash}';`,
		format: "JSONEachRow",
	});

	const rows: any[] = await res.json();

	const [row] = rows;
	if (row === undefined) return null;

	return row.block_number as number;
}
