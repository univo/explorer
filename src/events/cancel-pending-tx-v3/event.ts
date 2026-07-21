import { getAddress } from "viem";
import { asc, inArray, sql } from "drizzle-orm";
import { boolean, pgTable } from "drizzle-orm/pg-core";

import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { hex, id } from "@/db/schema";
import { numberToHex, nonNullable } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_account_v3 } from "@/indexes/account-v3";
import { getEventSuccess, createId, parseId } from "@/helpers";
import { index_block_number_tx_index_v3 } from "@/indexes/block-number-tx-index-v3";

export interface CancelPendingTxV3 {
	tag: "cancel_pending_tx_v3";
	id: string;
	success: boolean;
	from_address: `0x${string}`;
	nonce: `0x${string}`;
}

const table = pgTable("event_cancel_pending_tx_v3", {
	id: id().primaryKey(),
	nonce: hex().notNull(),
	success: boolean().notNull(),
	from_address: hex().notNull(),
});

export const event = univo.event({
	id: "cancel_pending_tx_v3",

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

				const id = createId({
					logIndex: "0x0",
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: tables.cancel_pending_tx_v2,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === tx.hash);

				return {
					id,
					success: getEventSuccess(receipt),
					from_address: getAddress(tx.from),
					nonce: numberToHex(Number(tx.nonce)),
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
							from_address: sql.raw(`excluded.${table.from_address.name}`),
							nonce: sql.raw(`excluded.${table.nonce.name}`),
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
	id: "cancel_pending_tx_v3_index_block_number_tx_index_v3",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "cancel_pending_tx_v3_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.from_address }, //
			];
		});
	},
});

export async function getCancelPendingTxV3(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === tables.cancel_pending_tx_v2);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client.select().from(table).where(inArray(table.id, filtered)).orderBy(asc(table.id));

	return rows.map<CancelPendingTxV3>((result) => {
		return {
			tag: "cancel_pending_tx_v3" as const,
			id: result.id,
			success: result.success,
			from_address: getAddress(result.from_address),
			nonce: result.nonce,
		};
	});
}
