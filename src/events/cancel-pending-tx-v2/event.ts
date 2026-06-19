import { getAddress } from "viem";

import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { hexToNumber, nonNullable } from "@/utils";
import {
	getDeduplicatedEvents,
	getEventSuccess,
	v2_createId,
	v2_getPartition,
	v2_getPartitions,
	v2_parseId,
} from "@/helpers";
import { index_block_number_tx_index_v2 } from "@/indexes/block-number-tx-index-v2";
import { index_account_v2 } from "@/indexes/account-v2";

export interface CancelPendingTxV2 {
	tag: "cancel_pending_tx_v2";
	id: string;
	success: boolean;
	from_address: `0x${string}`;
	nonce: number;
}

// CREATE TABLE event_cancel_pending_tx_v2 (
//     `id` FixedString(16),
//     `partition` UInt32,
//     `success` Bool,
//     `from_address` FixedString(20),
//     `nonce` UInt64
// )
// ENGINE = ReplacingMergeTree
// ORDER BY id
// PARTITION BY partition;

export const event = univo.event({
	id: "cancel_pending_tx_v2",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions
			.map((tx) => {
				// Must have a to address (not contract deployment)
				if (tx.to === null) {
					return;
				}

				// Must have same from and to address
				if (tx.from.toLowerCase() !== tx.to.toLowerCase()) {
					return;
				}

				// Must have zero ETH value
				if (tx.value !== "0x0") {
					return;
				}

				// Must have empty input data
				if (tx.input !== "0x") {
					return;
				}

				const id = v2_createId({
					logIndex: "0x0",
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: tables.cancel_pending_tx_v2,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const partition = v2_getPartition(block.eth_getBlockByNumber.timestamp);
				const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === tx.hash);

				return {
					id,
					partition,
					success: getEventSuccess(receipt),
					from_address: getAddress(tx.from),
					nonce: Number(tx.nonce),

					// Used for indexes
					chain: hexToNumber(block.eth_chainId),
					tx_index: hexToNumber(tx.transactionIndex),
					block_number: hexToNumber(block.eth_getBlockByNumber.number),
				};
			})
			.filter(nonNullable);
	},

	storage: {
		async upsert(batch) {
			if (batch.length === 0) {
				return;
			}

			const values = batch.map((event) => {
				return `(
					unhex('${event.id}'),
					${event.partition},
					${event.success},
					unhex('${event.from_address.slice(2)}'),
					${event.nonce}
				)`;
			});

			await db.command({
				query: `INSERT INTO event_cancel_pending_tx_v2 (id, partition, success, from_address, nonce) VALUES ${values.join(",")}`,
			});
		},

		async delete(batch) {
			await db.command({
				query: `DELETE FROM event_cancel_pending_tx_v2 WHERE ${v2_getPartitions(batch.map((event) => event.id)).join(" OR ")}`,
			});
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_tx_index_v2,
	id: "cancel_pending_tx_v2_index_block_number_tx_index_v2",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, chain: event.chain, block_number: event.block_number, tx_index: event.tx_index }, //
			];
		});
	},
});

univo.event({
	filters: event.filters,
	storage: index_account_v2,
	id: "cancel_pending_tx_v2_index_account_v2",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.from_address }, //
			];
		});
	},
});

export async function getCancelPendingTxV2(ids: string[]) {
	const filtered = ids.filter((id) => v2_parseId(id).tableId === tables.cancel_pending_tx_v2);

	if (filtered.length === 0) {
		return [];
	}

	const partitions = v2_getPartitions(filtered);

	const res = await db.query({
		query: `
			SELECT
				lower(hex(id)),
				success,
				concat('0x', lower(hex(from_address))) as from_address,
				nonce
			FROM event_cancel_pending_tx_v2
			WHERE ${partitions.join(" OR ")};
		`,
		format: "JSONEachRow",
	});

	const rows: any[] = await res.json();

	const events = rows.map<CancelPendingTxV2>((row) => {
		return {
			tag: "cancel_pending_tx_v2",
			id: row["lower(hex(id))"] as string,
			success: row.success as boolean,
			from_address: getAddress(row.from_address),
			nonce: row.nonce as number,
		};
	});

	return getDeduplicatedEvents(events);
}
