import { getAddress } from "viem";

import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { nonNullable } from "@/utils";
import {
	getDeduplicatedEvents,
	getEventSuccess,
	v2_createId,
	v2_getPartition,
	v2_getPartitions,
	v2_parseId,
} from "@/helpers";

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

univo.event({
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

				const id = v2_createId({
					logIndex: "0x0",
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: tables.native_transfer_v2,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const partition = v2_getPartition(block.eth_getBlockByNumber.timestamp);
				const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === tx.hash);

				return {
					id,
					partition,
					success: getEventSuccess(receipt),
					to_address: getAddress(tx.to),
					from_address: getAddress(tx.from),
					quantity: String(BigInt(tx.value)),
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
				query: `ALTER TABLE event_native_transfer_v2 UPDATE success = false WHERE ${v2_getPartitions(batch.map((event) => event.id)).join(" OR ")}`,
			});
		},
	},
});

export async function getNativeTransferV2(ids: string[]) {
	const filtered = ids.filter((id) => v2_parseId(id).tableId === tables.native_transfer_v2);

	if (filtered.length === 0) {
		return [];
	}

	const partitions = v2_getPartitions(filtered);

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
			to_address: row.to_address as `0x${string}`,
			from_address: row.from_address as `0x${string}`,
		};
	});

	return getDeduplicatedEvents(events);
}
