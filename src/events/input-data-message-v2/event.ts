import { getAddress } from "viem";

import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { nonNullable } from "@/utils";
import {
	getDeduplicatedEvents,
	getEventSuccess,
	v2_createId,
	v2_getPartition,
	v2_getPartitions,
	v2_parseId,
} from "@/helpers";

export interface InputDataMessageV2 {
	tag: "input_data_message_v2";
	id: string;
	success: boolean;
	message: string;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
}

// CREATE TABLE event_input_data_message_v2 (
//     `id` FixedString(16),
//     `partition` UInt32,
//     `success` Bool,
//     `message` String,
//     `to_address` FixedString(20),
//     `from_address` FixedString(20)
// )
// ENGINE = ReplacingMergeTree
// ORDER BY id
// PARTITION BY partition;

export const event = univo.event({
	id: "input_data_message_v2",

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

					const message = hex_to_string(tx.input);
					const num_valid_chars = count_valid_chars(message);
					const percent_valid_chars = num_valid_chars / message.length;

					// Use some heuristic to decide if input data is not gibberish characters
					if (percent_valid_chars < 0.6) {
						return null;
					}

					const id = v2_createId({
						logIndex: "0x0",
						chainId: block.eth_chainId,
						txIndex: tx.transactionIndex,
						tableId: tables.input_data_message_v2,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					const partition = v2_getPartition(block.eth_getBlockByNumber.timestamp);
					const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === tx.hash);

					return {
						id,
						partition,
						success: getEventSuccess(receipt),
						message,
						to_address: getAddress(tx.to),
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
			if (batch.length === 0) {
				return;
			}

			const values = batch.map((event) => {
				return `(
					unhex('${event.id}'),
					${event.partition},
					${event.success},
					${escapeChars(event.message)},
					unhex('${event.to_address.slice(2)}'),
					unhex('${event.from_address.slice(2)}')
				)`;
			});

			await db.command({
				query: `INSERT INTO event_input_data_message_v2 (id, partition, success, message, to_address, from_address) VALUES ${values.join(",")}`,
			});
		},

		async delete(batch) {
			await db.command({
				query: `DELETE FROM event_input_data_message_v2 WHERE ${v2_getPartitions(batch.map((event) => event.id)).join(" OR ")}`,
			});
		},
	},
});

const decoder = new TextDecoder();

function hex_to_string(hex: `0x${string}`) {
	const str = hex.slice(2);
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

function escapeChars(value: string) {
	return `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'").replaceAll("\n", "\\n").replaceAll("\r", "\\r").replaceAll("\t", "\\t")}'`;
}

export async function getInputDataMessageV2(ids: string[]) {
	const filtered = ids.filter((id) => v2_parseId(id).tableId === tables.input_data_message_v2);

	if (filtered.length === 0) {
		return [];
	}

	const partitions = v2_getPartitions(filtered);

	const res = await db.query({
		query: `
			SELECT
				lower(hex(id)),
				success,
				message,
				concat('0x', lower(hex(to_address))) as to_address,
				concat('0x', lower(hex(from_address))) as from_address
			FROM event_input_data_message_v2
			WHERE ${partitions.join(" OR ")};
		`,
		format: "JSONEachRow",
	});

	const rows: any[] = await res.json();

	const events = rows.map<InputDataMessageV2>((row) => {
		return {
			tag: "input_data_message_v2",
			id: row["lower(hex(id))"] as string,
			success: row.success as boolean,
			message: row.message as string,
			to_address: getAddress(row.to_address),
			from_address: getAddress(row.from_address),
		};
	});

	return getDeduplicatedEvents(events);
}
