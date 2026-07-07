import { getAddress } from "viem";

import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { hexToNumber, nonNullable } from "@/utils";
import { index_account_v2 } from "@/indexes/account-v2";
import { index_block_number_tx_index_v2 } from "@/indexes/block-number-tx-index-v2";
import { getDeduplicatedEvents, getEventSuccess, createId, getPartition, getPartitions, parseId } from "@/helpers";

export interface NativeTransferV2 {
	tag: "native_transfer_v2";
	id: string;
	success: boolean;
	quantity: string;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
}

// CREATE TABLE event_native_transfer_v2 (
//     `id` FixedString(16),
//     `partition` UInt32,
//     `success` Bool,
//     `quantity` UInt256,
//     `to_address` FixedString(20),
//     `from_address` FixedString(20)
// )
// ENGINE = ReplacingMergeTree
// ORDER BY id
// PARTITION BY partition;

export const event = univo.event({
	id: "native_transfer_v2",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions
			.map((tx) => {
				// When deploying a contract `to` field is null
				if (tx.to === null) {
					return;
				}

				// Only record non-zero transfers
				if (tx.value === "0x0") {
					return;
				}

				const id = createId({
					logIndex: "0x0",
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: tables.native_transfer_v2,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const partition = getPartition(block.eth_getBlockByNumber.timestamp);
				const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === tx.hash);

				return {
					id,
					partition,
					success: getEventSuccess(receipt),
					to_address: getAddress(tx.to),
					from_address: getAddress(tx.from),
					quantity: String(BigInt(tx.value)),

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
					toUInt256('${event.quantity}'),
					unhex('${event.to_address.slice(2)}'),
					unhex('${event.from_address.slice(2)}')
				)`;
			});

			await db.command({
				query: `INSERT INTO event_native_transfer_v2 (id, partition, success, quantity, to_address, from_address) VALUES ${values.join(",")}`,
			});
		},

		async delete(batch) {
			await db.command({
				query: `DELETE FROM event_native_transfer_v2 WHERE ${getPartitions(batch.map((event) => event.id)).join(" OR ")}`,
			});
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_tx_index_v2,
	id: "native_transfer_v2_index_block_number_tx_index_v2",
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
	id: "native_transfer_v2_index_account_v2",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.to_address }, //
				{ event_id: event.id, account: event.from_address },
			];
		});
	},
});

export async function getNativeTransferV2(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === tables.native_transfer_v2);

	if (filtered.length === 0) {
		return [];
	}

	const partitions = getPartitions(filtered);

	const res = await db.query({
		query: `
			SELECT
				lower(hex(id)),
				success,
				toString(quantity) as quantity,
				concat('0x', lower(hex(to_address))) as to_address,
				concat('0x', lower(hex(from_address))) as from_address
			FROM event_native_transfer_v2
			WHERE ${partitions.join(" OR ")};
		`,
		format: "JSONEachRow",
	});

	const rows: any[] = await res.json();

	const events = rows.map<NativeTransferV2>((row) => {
		return {
			tag: "native_transfer_v2",
			id: row["lower(hex(id))"] as string,
			success: row.success as boolean,
			quantity: row.quantity as string,
			to_address: getAddress(row.to_address),
			from_address: getAddress(row.from_address),
		};
	});

	return getDeduplicatedEvents(events);
}
