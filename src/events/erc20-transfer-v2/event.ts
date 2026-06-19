import { decodeEventLog, getAddress, parseAbiItem, toEventSelector } from "viem";

import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { nonNullable } from "@/utils";

import {
	getDeduplicatedEvents,
	getEventSuccess,
	getTxReceiptForLog,
	v2_parseId,
	v2_createId,
	v2_getPartition,
	v2_getPartitions,
} from "@/helpers";

export interface Erc20TransferV2 {
	tag: "erc20_transfer_v2";
	id: string;
	success: boolean;
	quantity: string;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
	token_address: `0x${string}`;
}

// CREATE TABLE event_erc20_transfer_v2 (
//     `id` FixedString(16),
//	   `partition` UInt32,
//     `success` Bool,
//     `quantity` UInt256,
//     `to_address` FixedString(20),
//     `from_address` FixedString(20),
//     `token_address` FixedString(20)
// )
// ENGINE = ReplacingMergeTree
// ORDER BY id
// PARTITION BY partition;

const abi = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");

univo.event({
	id: "erc20_transfer_v2",

	filters: [{ chain: 1, fromBlock: 0, event: toEventSelector(abi) }],

	handler: (block) => {
		return block.eth_getBlockReceipts
			.flatMap((receipt) => receipt.logs)
			.filter((log) => log.topics[0] === toEventSelector(abi))
			.map((log) => {
				try {
					const { args } = decodeEventLog({ topics: log.topics, data: log.data, strict: true, abi: [abi] });

					if (args.value === 0n) {
						return; // Only record non-zero transfers
					}

					const id = v2_createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: tables.erc20_transfer_v2,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					const partition = v2_getPartition(block.eth_getBlockByNumber.timestamp);

					const receipt = getTxReceiptForLog(block.eth_getBlockReceipts, log);

					return {
						id,
						partition,
						success: getEventSuccess(receipt),
						to_address: getAddress(args.to),
						from_address: getAddress(args.from),
						token_address: getAddress(log.address),
						quantity: String(args.value),
					};
				} catch (error) {
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
					toUInt256('${event.quantity}'),
					unhex('${event.to_address.slice(2)}'),
					unhex('${event.from_address.slice(2)}'),
					unhex('${event.token_address.slice(2)}')
				)`;
			});

			await db.command({
				query: `INSERT INTO event_erc20_transfer_v2 (id, partition, success, quantity, to_address, from_address, token_address) VALUES ${values.join(",")}`,
			});
		},

		async delete(batch) {
			await db.command({
				query: `ALTER TABLE event_erc20_transfer_v2 UPDATE success = false WHERE ${v2_getPartitions(batch.map((event) => event.id)).join(" OR ")}`,
			});
		},
	},
});

export async function getErc20TransferV2(ids: string[]) {
	const filtered = ids.filter((id) => v2_parseId(id).tableId === tables.erc20_transfer_v2);

	if (filtered.length === 0) {
		return [];
	}

	const partitions = v2_getPartitions(filtered);

	const res = await db.query({
		query: `
			SELECT
				lower(hex(id)),
				success,
				toString(quantity) as quantity,
				concat('0x', lower(hex(to_address))) as to_address,
				concat('0x', lower(hex(from_address))) as from_address,
				concat('0x', lower(hex(token_address))) as token_address
			FROM event_erc20_transfer_v2
			WHERE ${partitions.join(" OR ")};
		`,
		format: "JSONEachRow",
	});

	const rows: any[] = await res.json();

	const events = rows.map<Erc20TransferV2>((row) => {
		return {
			tag: "erc20_transfer_v2",
			id: row["lower(hex(id))"] as string,
			success: row.success as boolean,
			quantity: row.quantity as string,
			to_address: getAddress(row.to_address),
			from_address: getAddress(row.from_address),
			token_address: getAddress(row.token_address),
		};
	});

	return getDeduplicatedEvents(events);
}
