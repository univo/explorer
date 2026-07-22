import { getAddress } from "viem";
import { asc, inArray, sql } from "drizzle-orm";
import { boolean, pgTable } from "drizzle-orm/pg-core";

import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { hex, id } from "@/db/types";
import { nonNullable, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_account_v3 } from "@/indexes/account-v3";
import { getEventSuccess, createId, parseId } from "@/helpers";
import { index_block_number_tx_index_v3 } from "@/indexes/block-number-tx-index-v3";

export interface NativeTransferV3 {
	tag: "native_transfer_v3";
	id: string;
	success: boolean;
	quantity: `0x${string}`;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
}

export const table = pgTable("event_native_transfer_v3", {
	id: id().primaryKey(),
	quantity: hex().notNull(),
	to_address: hex().notNull(),
	success: boolean().notNull(),
	from_address: hex().notNull(),
});

export const event = univo.event({
	id: "native_transfer_v3",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions
			.map((tx) => {
				// When deploying a contract `to` field is null
				if (tx.to === null) {
					return;
				}

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

				const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === tx.hash);

				return {
					id,
					success: getEventSuccess(receipt),
					quantity: numberToHex(BigInt(tx.value)),
					to_address: getAddress(tx.to),
					from_address: getAddress(tx.from),
				};
			})
			.filter(nonNullable);
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
	storage: index_block_number_tx_index_v3,
	id: "native_transfer_v3_index_block_number_tx_index_v3",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "native_transfer_v3_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.to_address }, //
				{ event_id: event.id, account: event.from_address },
			];
		});
	},
});

export async function getNativeTransferV3(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === tables.native_transfer_v2);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client.select().from(table).where(inArray(table.id, filtered)).orderBy(asc(table.id));

	return rows.map<NativeTransferV3>((result) => {
		return {
			tag: "native_transfer_v3" as const,
			id: result.id,
			success: result.success,
			quantity: result.quantity,
			to_address: getAddress(result.to_address),
			from_address: getAddress(result.from_address),
		};
	});
}
