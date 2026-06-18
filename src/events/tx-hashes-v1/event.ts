import { db } from "@/db/client";
import { univo } from "@/lib/univo";

// CREATE TABLE kv_tx_hashes_v1 (
//     `block_number` UInt64,
//     `tx_index` UInt32,
//     `tx_hash` FixedString(66),
//     `created_at` DateTime64(3)
// )
// ENGINE = ReplacingMergeTree(created_at)
// ORDER BY (block_number, tx_index);

univo.event({
	id: "tx_hashes_v1",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.map((tx) => ({
			tx_hash: tx.hash,
			tx_index: Number(tx.transactionIndex),
			block_number: Number(block.eth_getBlockByNumber.number),
			created_at: Number(block.eth_getBlockByNumber.timestamp) * 1000,
		}));
	},

	storage: {
		async upsert(batch) {
			await db.insert({
				table: "kv_tx_hashes_v1",
				format: "JSONEachRow",
				values: batch.map((value) => ({
					tx_hash: value.tx_hash,
					block_number: value.block_number,
					tx_index: value.tx_index,
					created_at: value.created_at,
				})),
			});
		},
	},
});

export async function getTxHash(opts: { block_number: number; tx_index: number }) {
	const res = await db.query({
		query: `SELECT tx_hash FROM kv_tx_hashes_v1 WHERE block_number = ${opts.block_number} AND tx_index = ${opts.tx_index};`,
		format: "JSONEachRow",
	});

	const rows: any[] = await res.json();

	const [row] = rows;
	if (row === undefined) return null;

	return row.tx_hash as `0x${string}`;
}
