import { getAddress } from "viem";

import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { nonNullable } from "@/utils";
import { index_account_v1 } from "@/indexes/account-v1";
import { index_tx_hash_v1 } from "@/indexes/tx-hash-v1";
import { index_block_number_v2 } from "@/indexes/block-number-v2";
import { createId, getDeduplicatedEvents, getEventSuccess, parseId } from "@/helpers";

export interface InputDataMessageV1 {
	tag: "input_data_message_v1";
	id: string;
	success: boolean;
	message: string;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
}

// CREATE TABLE event_input_data_message_v1 (
//     `id` FixedString(36),
//     `success` Bool,
//     `message` String,
//     `to_address` FixedString(42),
//     `from_address` FixedString(42),
// )
// ENGINE = ReplacingMergeTree
// ORDER BY (id);

const event = univo.event({
	id: "input_data_message_v1",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler(block) {
		return block.eth_getBlockByHash.transactions
			.map((tx) => {
				try {
					if (tx.input === "0x") return null;
					if (tx.input === "0x0") return null;
					if (tx.input.length < 16) return null;

					// When deploying a contract `to` field is null and we know input data is not a message
					if (tx.to === null) return null;

					const message = hex_to_string(tx.input);
					const num_valid_chars = count_valid_chars(message);
					const percent_valid_chars = num_valid_chars / message.length;

					// Use some heuristic to decide if input data is not gibberish characters
					if (percent_valid_chars < 0.6) return null;

					const id = createId({
						log_index: "0x0",
						chain_id: block.eth_chainId,
						tx_index: tx.transactionIndex,
						table_id: tables.input_data_message_v1,
						block_number: block.eth_getBlockByHash.number,
						block_timestamp: block.eth_getBlockByHash.timestamp,
					});

					const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === tx.hash);

					return {
						id,
						success: getEventSuccess(receipt),
						message,
						to_address: getAddress(tx.to),
						from_address: getAddress(tx.from),
						// Used for indexing
						tx_hash: tx.hash,
						block_number: Number(block.eth_getBlockByHash.number),
					};
				} catch {
					return null;
				}
			})
			.filter(nonNullable);
	},

	storage: {
		async upsert(batch) {
			await db.insert({
				table: "event_input_data_message_v1",
				format: "JSONEachRow",
				values: batch.map((value) => ({
					id: value.id,
					success: value.success,
					message: value.message,
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
	id: "input_data_message_v1_index_account_v1",
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
	id: "input_data_message_v1_index_tx_hash_v1",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, tx_hash: event.tx_hash }, //
		]);
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_v2,
	id: "input_data_message_v1_index_block_number_v2",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, block_number: event.block_number }, //
		]);
	},
});

const decoder = new TextDecoder();

function hex_to_string(hex: `0x${string}`) {
	const str = hex.slice(2); // Remove prefix

	const bytes = new Uint8Array(str.length / 2);

	for (let i = 0; i < str.length; i += 2) {
		const byte = str.substring(i, i + 2);
		bytes[i / 2] = Number.parseInt(byte, 16);
	}

	return decoder.decode(bytes);
}

const VALID_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890.? ";

function count_valid_chars(string: string) {
	let count = 0;

	for (const char of string) {
		if (VALID_CHARS.indexOf(char) >= 0) {
			count++;
		}
	}

	return count;
}

export async function getInputDataMessageV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).table_id === tables.input_data_message_v1);

	if (filtered.length === 0) return [];

	const mapped = filtered.map((id) => `'${id}'`);

	const res = await db.query({
		query: `SELECT * from event_input_data_message_v1 WHERE id IN (${mapped.join(",")});`,
		format: "JSONEachRow",
	});

	const rows: any[] = await res.json();

	const events = rows.map<InputDataMessageV1>((row) => {
		return {
			tag: "input_data_message_v1",
			id: row.id as string,
			success: row.success as boolean,
			message: row.message as string,
			to_address: row.to_address as `0x${string}`,
			from_address: row.from_address as `0x${string}`,
		};
	});

	return getDeduplicatedEvents(events);
}
