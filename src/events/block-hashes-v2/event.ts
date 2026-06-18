import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { hexToNumber } from "@/utils";

// CREATE TABLE kv_block_hashes_v2 (
//     `block_hash` FixedString(32),
//     `block_number` UInt64,
// )
// ENGINE = ReplacingMergeTree
// ORDER BY block_hash;

univo.event({
	id: "block_hashes_v2",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return [
			{
				block_hash: block.eth_getBlockByNumber.hash,
				block_number: hexToNumber(block.eth_getBlockByNumber.number),
			},
		];
	},

	storage: {
		async upsert(batch) {
			if (batch.length === 0) {
				return;
			}

			const values = batch.map((event) => {
				return `(
					unhex('${event.block_hash.slice(2)}'),
					${event.block_number},
				)`;
			});

			await db.command({
				query: `INSERT INTO kv_block_hashes_v2 (block_hash, block_number) VALUES ${values.join(",")}`,
			});
		},
	},
});

export async function getBlockNumber(blockHash: `0x${string}`) {
	const res = await db.query({
		query: `SELECT block_number FROM kv_block_hashes_v2 WHERE block_hash = unhex('${blockHash.slice(2)}');`,
		format: "JSONEachRow",
	});

	const [row]: any[] = await res.json();

	if (row === undefined) {
		return null;
	}

	return row.block_number as number;
}
