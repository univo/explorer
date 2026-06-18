import type { chains } from "@/constants";

// Transactions can be uniquely represented by in two ways: their transaction hash, or the combination of their block number
// and transaction index. In general, the explorer uses the latter and there are a few reasons why:
//
// - Storage cost. The latter is requires much less storage to implement. So much so that we actually use that id inside of
//   our event identifiers. This is what allows users to click an event id and for us to understand what transaction it
//   originated from without having to consult any other source.
//
// - Covered index. The same index can used a look for events from a given block number.

// TODO: Do we now need to include the chain id?
// TODO: Does this index allow us to remove the block number index?
// TODO: Do we still need an index to map [block number, transaction index] to transaction hash?

// CREATE TABLE index_block_number_tx_index_v1 (
//     `chain` UInt16,
//     `block_number` UInt64,
//     `tx_index` UInt64,
//     `event_id` FixedString(16)
// )
// ENGINE = ReplacingMergeTree
// ORDER BY (chain, block_number, tx_index, event_id);

export const index_block_number_tx_index_v1 = {
	async upsert(indexes: any) {},

	async delete(indexes: any) {
		//
	},
};

export async function getEventIds(chain: keyof typeof chains, blockNumber: number, txIndex?: number) {
	//
}
