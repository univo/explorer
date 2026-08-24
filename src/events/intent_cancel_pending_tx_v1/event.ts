import { getAddress } from "viem";
import { asc, inArray, sql } from "drizzle-orm";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { numberToHex, isHexEqual } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_account_v3 } from "@/indexes/account-v3";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { getEventSuccess, createId, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface IntentCancelPendingTxV1 {
	tag: "intent_cancel_pending_tx_v1";
	id: string;
	success: boolean;
	nonce: `0x${string}`;
	from_address: `0x${string}`;
}

export const event = univo.event({
	id: "intent_cancel_pending_tx_v1",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
			// When deploying a contract the `to` field is null
			if (tx.to === null) {
				return [];
			}

			// Must have same from and to address
			if (!isHexEqual(tx.from, tx.to)) {
				return [];
			}

			// Must have zero ETH value
			if (BigInt(tx.value) !== 0n) {
				return [];
			}

			// Must have empty input data
			if (tx.input !== "0x") {
				return [];
			}

			const id = createId({
				chainId: block.eth_chainId,
				logIndex: TRANSACTION_EVENT,
				txIndex: tx.transactionIndex,
				tableId: TABLES.intent_cancel_pending_tx_v1,
				blockNumber: block.eth_getBlockByNumber.number,
				blockTimestamp: block.eth_getBlockByNumber.timestamp,
			});

			const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionHash, tx.hash));

			return {
				id,
				success: getEventSuccess(receipt),
				from_address: getAddress(tx.from),
				nonce: numberToHex(Number(tx.nonce)),
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
							nonce: sql.raw(`excluded.${table.nonce.name}`),
							success: sql.raw(`excluded.${table.success.name}`),
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
	id: "intent_cancel_pending_tx_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_cancel_pending_tx_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.from_address }, //
			];
		});
	},
});

export async function getIntentCancelPendingTxV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_cancel_pending_tx_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentCancelPendingTxV1>((result) => {
		return {
			tag: "intent_cancel_pending_tx_v1" as const,
			id: result.id,
			nonce: result.nonce,
			success: result.success,
			from_address: getAddress(result.from_address),
		};
	});
}
