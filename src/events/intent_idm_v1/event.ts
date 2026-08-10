import { getAddress } from "viem";
import { asc, inArray, sql } from "drizzle-orm";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { isHexEqual } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_account_v3 } from "@/indexes/account-v3";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { getEventSuccess, createId, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface IntentIdmV1 {
	tag: "intent_idm_v1";
	id: string;
	success: boolean;
	message: string;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
}

export const event = univo.event({
	id: "intent_idm_v1",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler(block) {
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
			try {
				if (tx.input === "0x" || tx.input === "0x0") {
					return [];
				}

				// When deploying a contract the `to` field is null and we know input data is not a message
				if (tx.to === null) {
					return [];
				}

				const message = hexToString(tx.input);
				const numValidChars = countValidChars(message);
				const percentValidChars = numValidChars / message.length;

				// Ignore short messages
				if (message.length < 16) {
					return [];
				}

				// Ensure data is not gibberish characters
				if (percentValidChars < 0.9) {
					return [];
				}

				const id = createId({
					chainId: block.eth_chainId,
					logIndex: TRANSACTION_EVENT,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_idm_v1,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionHash, tx.hash));

				return {
					id,
					message,
					to_address: getAddress(tx.to),
					success: getEventSuccess(receipt),
					from_address: getAddress(tx.from),
				};
			} catch {
				return [];
			}
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
							message: sql.raw(`excluded.${table.message.name}`),
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
	id: "intent_idm_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_idm_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.to_address }, //
				{ event_id: event.id, account: event.from_address },
			];
		});
	},
});

const decoder = new TextDecoder();

function hexToString(hex: `0x${string}`) {
	const str = hex.slice(2);
	const bytes = new Uint8Array(str.length / 2);

	for (let i = 0; i < str.length; i += 2) {
		const byte = str.substring(i, i + 2);
		bytes[i / 2] = Number.parseInt(byte, 16);
	}

	const raw = decoder.decode(bytes);

	return sanitizeText(raw);
}

function sanitizeText(text: string) {
	// Postgres prohibits null characters inside text columns because it uses null bytes
	// internally to denote the end of strings.
	return text.replaceAll(/\0/g, "");
}

const VALID_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890.? ";

function countValidChars(string: string) {
	let count = 0;

	for (const char of string) {
		if (VALID_CHARS.indexOf(char) >= 0) {
			count++;
		}
	}

	return count;
}

export async function getIntentIdmV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_idm_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentIdmV1>((result) => {
		return {
			tag: "intent_idm_v1" as const,
			id: result.id,
			success: result.success,
			message: result.message,
			to_address: getAddress(result.to_address),
			from_address: getAddress(result.from_address),
		};
	});
}
