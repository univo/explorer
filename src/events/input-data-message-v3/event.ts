import { getAddress } from "viem";
import { asc, inArray, sql } from "drizzle-orm";
import { boolean, pgTable, text } from "drizzle-orm/pg-core";

import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { hex, id } from "@/db/schema";
import { nonNullable } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_account_v3 } from "@/indexes/account-v3";
import { getEventSuccess, createId, parseId } from "@/helpers";
import { index_block_number_tx_index_v3 } from "@/indexes/block-number-tx-index-v3";

export interface InputDataMessageV3 {
	tag: "input_data_message_v3";
	id: string;
	success: boolean;
	message: string;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
}

const table = pgTable("event_input_data_message_v3", {
	id: id().primaryKey(),
	message: text().notNull(),
	success: boolean().notNull(),
	to_address: hex().notNull(),
	from_address: hex().notNull(),
});

export const event = univo.event({
	id: "input_data_message_v3",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler(block) {
		return block.eth_getBlockByNumber.transactions
			.map((tx) => {
				try {
					if (tx.input === "0x") {
						return null;
					}

					if (tx.input === "0x0") {
						return null;
					}

					if (tx.input.length < 16) {
						return null;
					}

					// When deploying a contract `to` field is null and we know input data is not a message
					if (tx.to === null) {
						return null;
					}

					const message = hexToString(tx.input);
					const num_valid_chars = countValidChars(message);
					const percent_valid_chars = num_valid_chars / message.length;

					// Use some heuristic to decide if input data is not gibberish characters
					if (percent_valid_chars < 0.6) {
						return null;
					}

					const id = createId({
						logIndex: "0x0",
						chainId: block.eth_chainId,
						txIndex: tx.transactionIndex,
						tableId: tables.input_data_message_v2,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === tx.hash);

					return {
						id,
						message,
						to_address: getAddress(tx.to),
						success: getEventSuccess(receipt),
						from_address: getAddress(tx.from),
					};
				} catch {
					return null;
				}
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
	storage: index_block_number_tx_index_v3,
	id: "input_data_message_v3_index_block_number_tx_index_v3",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "input_data_message_v3_index_account_v3",
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

export async function getInputDataMessageV3(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === tables.input_data_message_v2);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client.select().from(table).where(inArray(table.id, filtered)).orderBy(asc(table.id));

	return rows.map<InputDataMessageV3>((result) => {
		return {
			tag: "input_data_message_v3" as const,
			id: result.id,
			success: result.success,
			message: result.message,
			to_address: getAddress(result.to_address),
			from_address: getAddress(result.from_address),
		};
	});
}
