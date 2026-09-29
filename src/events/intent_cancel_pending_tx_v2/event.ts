import { and, asc, inArray } from "drizzle-orm";
import { getAddress, hexToNumber } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { inTuple } from "@/db/types";
import type { Id } from "@/events";
import { getEventSuccess } from "@/helpers";
import { numberToHex, isHexEqual } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v4 } from "@/indexes/index_account_v4";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface IntentCancelPendingTxV2 {
	tag: "intent_cancel_pending_tx_v2";
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	success: boolean;
	nonce: `0x${string}`;
	from_address: `0x${string}`;
}

export const event = univo.event({
	id: "intent_cancel_pending_tx_v2",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap<IntentCancelPendingTxV2>((tx) => {
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

			const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionIndex, tx.transactionIndex));

			return {
				tag: "intent_cancel_pending_tx_v2",
				chain: hexToNumber(block.eth_chainId),
				log_index: hexToNumber(TRANSACTION_EVENT),
				tx_index: hexToNumber(tx.transactionIndex),
				block_number: hexToNumber(block.eth_getBlockByNumber.number),
				block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
				success: getEventSuccess(receipt),
				from_address: getAddress(tx.from),
				nonce: numberToHex(BigInt(tx.nonce)),
			};
		});
	},

	storage: {
		async upsert(events) {
			const MAX_BATCH_SIZE = 4000;
			const client = await createPostgresClient();

			for (let i = 0; i < events.length; i += MAX_BATCH_SIZE) {
				await client.insert(table).values(events.slice(i, i + MAX_BATCH_SIZE));
			}
		},

		async delete(events) {
			const client = await createPostgresClient();

			await client.delete(table).where(
				and(
					inArray(
						table.block_timestamp,
						events.map((event) => event.block_timestamp),
					),
					inTuple(
						[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
						events.map((event) => [event.block_timestamp, event.block_number, event.tx_index, event.log_index, event.chain]),
					),
				),
			);
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_tx_index_v4,
	handler: (block) => event.handler(block),
	id: "intent_cancel_pending_tx_v2_index_block_number_tx_index_v4",
});

univo.event({
	filters: event.filters,
	storage: index_account_v4,
	id: "intent_cancel_pending_tx_v2_index_account_v4",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ id: event, account: event.from_address }, //
			];
		});
	},
});

export async function getIntentCancelPendingTxV2(ids: Id[]) {
	const filtered = ids.filter((id) => TABLES[id.tag] === TABLES.intent_cancel_pending_tx_v2);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.selectDistinct()
		.from(table)
		.where(
			and(
				inArray(
					table.block_timestamp,
					filtered.map((id) => id.block_timestamp),
				),
				inTuple(
					[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
					filtered.map((id) => [id.block_timestamp, id.block_number, id.tx_index, id.log_index, id.chain]),
				),
			),
		)
		.orderBy(asc(table.block_timestamp), asc(table.block_number), asc(table.tx_index), asc(table.log_index), asc(table.chain));

	return rows.map<IntentCancelPendingTxV2>((row) => {
		return {
			tag: "intent_cancel_pending_tx_v2",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			nonce: row.nonce,
			success: row.success,
			from_address: getAddress(row.from_address),
		};
	});
}
