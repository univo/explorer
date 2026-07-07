import { db } from "@/db/client";
import { logger } from "@/utils";
import type { chains } from "@/constants";
import { getInternalChain, parseId } from "@/helpers";

// Transactions can be uniquely represented by in two ways: their transaction hash, or the combination of their block number
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

// CREATE TABLE index_block_number_tx_index_v2 (
//     `chain` UInt16,
//     `block_number` UInt64,
//     `tx_index` UInt64,
//     `event_id` FixedString(16)
// )
// ENGINE = ReplacingMergeTree
// ORDER BY (chain, block_number, tx_index, event_id);

type Index = {
	chain: number;
	block_number: number;
	tx_index: number;
	event_id: string;
};

export const index_block_number_tx_index_v2 = {
	async upsert(indexes: Index[]) {
		if (indexes.length === 0) {
			return;
		}

		const unique: Record<string, true> = {};

		const values: Index[] = [];

		for (const index of indexes) {
			const key = [index.chain, index.block_number, index.tx_index, index.event_id].join(":");

			if (unique[key]) {
				continue;
			}

			unique[key] = true;

			const externalChain = parseId(index.event_id).chainId;
			const internalChain = getInternalChain(externalChain);

			values.push({
				chain: internalChain,
				block_number: index.block_number,
				tx_index: index.tx_index,
				event_id: index.event_id,
			});
		}

		const mapped = values.map((value) => {
			return `(
                ${value.chain},
                ${value.block_number},
                ${value.tx_index},
                unhex('${value.event_id}')
            )`;
		});

		await db.command({
			query: `INSERT INTO index_block_number_tx_index_v2 (chain, block_number, tx_index, event_id) VALUES ${mapped.join(",")}`,
		});
	},

	async delete(indexes: Index[]) {
		let chain = undefined;
		let block_number = undefined;

		for (const index of indexes) {
			if (chain === undefined) {
				chain = index.chain;
			}

			if (chain !== index.chain) {
				throw new Error("Expected entire batch to be from the same chain");
			}

			if (block_number === undefined) {
				block_number = index.block_number;
			}

			if (block_number !== index.block_number) {
				throw new Error("Expected entire batch to be from the same block number");
			}
		}

		if (chain === undefined || block_number === undefined) {
			throw new Error("Expected at least one index");
		}

		await db.command({
			query: `DELETE FROM index_block_number_tx_index_v2 WHERE chain = ${chain} AND block_number = ${block_number}`,
		});
	},
};

export async function getEventIdsForBlock(chain: keyof typeof chains, block: number) {
	const start = Date.now();

	const res = await db.query({
		query: `SELECT lower(hex(event_id)) FROM index_block_number_tx_index_v2 WHERE chain = ${chain} AND block_number = ${block};`,
		format: "JSONEachRow",
	});

	const rows: Record<string, string>[] = await res.json();

	logger.debug(`Found ${rows.length} events for block in ${Date.now() - start}ms`);

	return rows.map((row) => row["lower(hex(event_id))"]) as string[];
}

export async function getEventIdsForTx(chain: keyof typeof chains, block: number, tx: number) {
	const start = Date.now();

	const res = await db.query({
		query: `SELECT lower(hex(event_id)) FROM index_block_number_tx_index_v2 WHERE chain = ${chain} AND block_number = ${block} AND tx_index = ${tx};`,
		format: "JSONEachRow",
	});

	const rows: Record<string, string>[] = await res.json();

	logger.debug(`Found ${rows.length} events for tx in ${Date.now() - start}ms`);

	return rows.map((row) => row["lower(hex(event_id))"]) as string[];
}
