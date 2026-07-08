import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { hexToNumber } from "@/utils";

// CREATE TABLE kv_tx_hashes_v2 (
//     `tx_hash` FixedString(32),
//     `block_number` UInt64,
//     `tx_index` UInt32,
// )
// ENGINE = ReplacingMergeTree
// ORDER BY tx_hash;

export const event = univo.event({
	id: "tx_hashes_v2",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.map((tx) => ({
			tx_hash: tx.hash,
			block_number: hexToNumber(block.eth_getBlockByNumber.number),
			tx_index: hexToNumber(tx.transactionIndex),
		}));
	},

	storage: {
		async upsert(batch) {
			if (batch.length === 0) {
				return;
			}

			const values = batch.map((event) => {
				return `(
					unhex('${event.tx_hash.slice(2)}'),
					${event.block_number},
					${event.tx_index}
				)`;
			});

			await db.command({
				query: `INSERT INTO kv_tx_hashes_v2 (tx_hash, block_number, tx_index) VALUES ${values.join(",")}`,
			});
		},

		async delete(batch) {
			await db.command({
				query: `DELETE FROM kv_tx_hashes_v2 WHERE tx_hash IN (${batch.map((event) => `unhex('${event.tx_hash.slice(2)}')`).join(",")})`,
			});
		},
	},
});

export async function getTxPosition(txHash: `0x${string}`) {
	const res = await db.query({
		query: `SELECT block_number, tx_index FROM kv_tx_hashes_v2 WHERE tx_hash = unhex('${txHash.slice(2)}')`,
		format: "JSONEachRow",
	});

	const [row] = await res.json<any>();

	if (row === undefined) {
		return null;
	}

	return {
		block: row.block_number as number,
		tx: row.tx_index as number,
	};
}
