import { and, asc, inArray } from "drizzle-orm";
import { getAddress, hexToNumber } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { inTuple } from "@/db/types";
import { isHexEqual } from "@/utils";
import type { Id } from "@/events";
import { getEventSuccess } from "@/helpers";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v4 } from "@/indexes/index_account_v4";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface IntentIdmV2 {
	tag: "intent_idm_v2";
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	success: boolean;
	message: string;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
}

export const event = univo.event({
	id: "intent_idm_v2",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler(block) {
		return block.eth_getBlockByNumber.transactions.flatMap<IntentIdmV2>((tx) => {
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

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionIndex, tx.transactionIndex));

				return {
					tag: "intent_idm_v2",
					chain: hexToNumber(block.eth_chainId),
					log_index: hexToNumber(TRANSACTION_EVENT),
					tx_index: hexToNumber(tx.transactionIndex),
					block_number: hexToNumber(block.eth_getBlockByNumber.number),
					block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
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
	id: "intent_idm_v2_index_block_number_tx_index_v4",
});

univo.event({
	filters: event.filters,
	storage: index_account_v4,
	id: "intent_idm_v2_index_account_v4",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event, account: event.to_address }, //
				{ event, account: event.from_address },
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

export async function getIntentIdmV2(ids: Id[]) {
	const filtered = ids.filter((id) => TABLES[id.tag] === TABLES.intent_idm_v2);

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

	return rows.map<IntentIdmV2>((row) => {
		return {
			tag: "intent_idm_v2",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			success: row.success,
			message: row.message,
			to_address: getAddress(row.to_address),
			from_address: getAddress(row.from_address),
		};
	});
}
