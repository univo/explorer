import { getAddress } from "viem";

import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { nonNullable } from "@/utils";
import { index_account_v1 } from "@/indexes/account-v1";
import { index_tx_hash_v1 } from "@/indexes/tx-hash-v1";
import { index_block_number_v2 } from "@/indexes/block-number-v2";
import { createId, getDeduplicatedEvents, getEventSuccess, parseId } from "@/helpers";

export interface NativeTransferV1 {
	tag: "native_transfer_v1";
	id: string;
	success: boolean;
	quantity: string;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
}

// CREATE TABLE event_native_transfer_v1 (
//     `id` FixedString(36),
//     `success` Bool,
//     `quantity` String,
//     `to_address` FixedString(42),
//     `from_address` FixedString(42),
// )
// ENGINE = ReplacingMergeTree
// ORDER BY (id);

const event = univo.event({
	id: "native_transfer_v1",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockByHash.transactions
			.map((tx) => {
				// When deploying a contract `to` field is null
				if (tx.to === null) return;

				// Only record non-zero transfers
				if (tx.value === "0x0") return;

				const id = createId({
					log_index: "0x0",
					chain_id: block.eth_chainId,
					tx_index: tx.transactionIndex,
					table_id: tables.native_transfer_v1,
					block_number: block.eth_getBlockByHash.number,
					block_timestamp: block.eth_getBlockByHash.timestamp,
				});

				const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === tx.hash);

				return {
					id,
					success: getEventSuccess(receipt),
					to_address: getAddress(tx.to),
					from_address: getAddress(tx.from),
					quantity: String(BigInt(tx.value)),
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
				table: "event_native_transfer_v1",
				format: "JSONEachRow",
				values: batch.map((value) => ({
					id: value.id,
					success: value.success,
					quantity: value.quantity,
					to_address: value.to_address,
					from_address: value.from_address,
				})),
			});
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_account_v1,
	id: "native_transfer_v1_index_account_v1",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, account: event.to_address },
			{ id: event.id, account: event.from_address },
		]);
	},
});

univo.event({
	filters: event.filters,
	storage: index_tx_hash_v1,
	id: "native_transfer_v1_index_tx_hash_v1",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, tx_hash: event.tx_hash }, //
		]);
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_v2,
	id: "native_transfer_v1_index_block_number_v2",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, block_number: event.block_number }, //
		]);
	},
});

export async function getNativeTransferV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).table_id === tables.native_transfer_v1);

	if (filtered.length === 0) return [];

	const mapped = filtered.map((id) => `'${id}'`);

	const res = await db.query({
		query: `SELECT * FROM event_native_transfer_v1 WHERE id IN (${mapped.join(",")});`,
		format: "JSONEachRow",
	});

	const rows: any[] = await res.json();

	const events = rows.map<NativeTransferV1>((row) => {
		return {
			tag: "native_transfer_v1",
			id: row.id as string,
			success: row.success as boolean,
			quantity: row.quantity as string,
			to_address: row.to_address as `0x${string}`,
			from_address: row.from_address as `0x${string}`,
		};
	});

	return getDeduplicatedEvents(events);
}
