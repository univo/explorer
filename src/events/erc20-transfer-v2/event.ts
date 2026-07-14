import { decodeEventLog, getAddress, parseAbiItem, toEventSelector } from "viem";

import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { hexToNumber, nonNullable } from "@/utils";

import {
	getDeduplicatedEvents,
	getEventSuccess,
	getTxReceiptForLog,
	parseId,
	createId,
	getPartition,
	getPartitions,
} from "@/helpers";
import { index_account_v2 } from "@/indexes/account-v2";
import { index_block_number_tx_index_v2 } from "@/indexes/block-number-tx-index-v2";

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

export const event = univo.event({
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

					const id = createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: tables.erc20_transfer_v2,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					const partition = getPartition(block.eth_getBlockByNumber.timestamp);

					const receipt = getTxReceiptForLog(block.eth_getBlockReceipts, log);

					return {
						id,
						partition,
						success: getEventSuccess(receipt),
						to_address: getAddress(args.to),
						from_address: getAddress(args.from),
						token_address: getAddress(log.address),
						quantity: String(args.value),

						// Used for indexes
						chain: hexToNumber(block.eth_chainId),
						tx_index: hexToNumber(log.transactionIndex),
						block_number: hexToNumber(block.eth_getBlockByNumber.number),
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
				query: `DELETE FROM event_erc20_transfer_v2 WHERE ${getPartitions(batch.map((event) => event.id)).join(" OR ")}`,
			});
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_tx_index_v2,
	id: "erc20_transfer_v2_index_block_number_tx_index_v2",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, chain: event.chain, block_number: event.block_number, tx_index: event.tx_index }, //
			];
		});
	},
});

univo.event({
	filters: event.filters,
	storage: index_account_v2,
	id: "erc20_transfer_v2_index_account_v2",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.to_address }, //
				{ event_id: event.id, account: event.from_address },
				{ event_id: event.id, account: event.token_address },
			];
		});
	},
});

export async function getErc20TransferV2(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === tables.erc20_transfer_v2);

	if (filtered.length === 0) {
		return [];
	}

	const partitions = getPartitions(filtered);

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
