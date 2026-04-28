import { getAddress } from "viem";

import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { nonNullable } from "@/utils";
import { index_account_v1 } from "@/indexes/account-v1";
import { index_tx_hash_v1 } from "@/indexes/tx-hash-v1";
import { index_block_number_v2 } from "@/indexes/block-number-v2";
import { createId, getDeduplicatedEvents, getEventSuccess, parseId } from "@/helpers";

// 0xfa14e402325f30b24add5d897cb801d31486669f6d48f14348b6844955946a03

export interface CancelPendingTxV1 {
	tag: "cancel_pending_tx_v1";
	id: string;
	success: boolean;
	from_address: `0x${string}`;
	nonce: number;
}

// CREATE TABLE event_cancel_pending_tx_v1 (
//     `id` FixedString(36),
//     `success` Bool,
//     `from_address` FixedString(42),
//     `nonce` UInt64,
// )
// ENGINE = ReplacingMergeTree
// ORDER BY (id);

const event = univo.event({
	id: "cancel_pending_tx_v1",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockByHash.transactions
			.map((tx) => {
				// Must have a to address (not contract deployment)
				if (tx.to === null) return;

				// Must have same from and to address
				if (tx.from.toLowerCase() !== tx.to.toLowerCase()) return;

				// Must have zero ETH value
				if (tx.value !== "0x0") return;

				// Must have empty input data
				if (tx.input !== "0x") return;

				const id = createId({
					log_index: "0x0",
					chain_id: block.eth_chainId,
					tx_index: tx.transactionIndex,
					table_id: tables.cancel_pending_tx_v1,
					block_number: block.eth_getBlockByHash.number,
					block_timestamp: block.eth_getBlockByHash.timestamp,
				});

				const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === tx.hash);

				return {
					id,
					success: getEventSuccess(receipt),
					from_address: getAddress(tx.from),
					nonce: Number(tx.nonce),
					// Used for indexing
					tx_hash: tx.hash,
					block_number: Number(block.eth_getBlockByHash.number),
				};
			})
			.filter(nonNullable);
	},

	storage: {
		async upsert(batch) {
			await db.insert({
				table: "event_cancel_pending_tx_v1",
				format: "JSONEachRow",
				values: batch.map((value) => ({
					id: value.id,
					success: value.success,
					from_address: value.from_address,
					nonce: value.nonce,
				})),
			});
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_account_v1,
	id: "cancel_pending_tx_v1_index_account_v1",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, account: event.from_address }, //
		]);
	},
});

univo.event({
	filters: event.filters,
	storage: index_tx_hash_v1,
	id: "cancel_pending_tx_v1_index_tx_hash_v1",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, tx_hash: event.tx_hash }, //
		]);
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_v2,
	id: "cancel_pending_tx_v1_index_block_number_v2",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, block_number: event.block_number }, //
		]);
	},
});

export async function getCancelPendingTxV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).table_id === tables.cancel_pending_tx_v1);

	if (filtered.length === 0) return [];

	const mapped = filtered.map((id) => `'${id}'`);

	const res = await db.query({
		query: `SELECT * FROM event_cancel_pending_tx_v1 WHERE id IN (${mapped.join(",")});`,
		format: "JSONEachRow",
	});

	const rows: any[] = await res.json();

	const events = rows.map<CancelPendingTxV1>((row) => {
		return {
			tag: "cancel_pending_tx_v1",
			id: row.id as string,
			success: row.success as boolean,
			from_address: row.from_address as `0x${string}`,
			nonce: row.nonce as number,
		};
	});

	return getDeduplicatedEvents(events);
}
