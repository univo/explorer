import { getAddress } from "viem";
import { asc, inArray, sql } from "drizzle-orm";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { isHexEqual } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v3 } from "@/indexes/account-v3";
import { getEventSuccess, createId, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface IntentNativeTransferV1 {
	tag: "intent_native_transfer_v1";
	id: string;
	success: boolean;
	quantity: `0x${string}`;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
}

export const event = univo.event({
	id: "intent_native_transfer_v1",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
			if (BigInt(tx.value) === 0n) {
				return [];
			}

			// When deploying a contract `to` field is null
			if (tx.to === null) {
				return [];
			}

			// Ensure that calldata is empty, otherwise it's likely a contract interaction
			if (!(tx.input === "0x" || tx.input === "0x0")) {
				return [];
			}

			const id = createId({
				chainId: block.eth_chainId,
				logIndex: TRANSACTION_EVENT,
				txIndex: tx.transactionIndex,
				tableId: TABLES.intent_native_transfer_v1,
				blockNumber: block.eth_getBlockByNumber.number,
				blockTimestamp: block.eth_getBlockByNumber.timestamp,
			});

			const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionHash, tx.hash));

			return {
				id,
				quantity: tx.value,
				to_address: getAddress(tx.to),
				success: getEventSuccess(receipt),
				from_address: getAddress(tx.from),
			};
		});
	},

	storage: {
		async upsert(batch) {
			const MAX_BATCH_SIZE = 8000;

			const client = await createPostgresClient();

			for (let i = 0; i < batch.length; i += MAX_BATCH_SIZE) {
				await client
					.insert(table)
					.values(batch.slice(i, i + MAX_BATCH_SIZE))
					.onConflictDoUpdate({
						target: table.id,
						set: {
							success: sql.raw(`excluded.${table.success.name}`),
							quantity: sql.raw(`excluded.${table.quantity.name}`),
							to_address: sql.raw(`excluded.${table.to_address.name}`),
							from_address: sql.raw(`excluded.${table.from_address.name}`),
						},
					});
			}
		},

		async delete(batch) {
			const client = await createPostgresClient();

			await client.delete(table).where(
				inArray(
					table.id,
					batch.map((event) => event.id),
				),
			);
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_tx_index_v4,
	id: "intent_native_transfer_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_native_transfer_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.to_address }, //
				{ event_id: event.id, account: event.from_address },
			];
		});
	},
});

export async function getIntentNativeTransferV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_native_transfer_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentNativeTransferV1>((result) => {
		return {
			tag: "intent_native_transfer_v1" as const,
			id: result.id,
			success: result.success,
			quantity: result.quantity,
			to_address: getAddress(result.to_address),
			from_address: getAddress(result.from_address),
		};
	});
}
