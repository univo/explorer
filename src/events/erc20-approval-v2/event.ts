import { decodeEventLog, getAddress, parseAbiItem, toEventSelector } from "viem";

import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { hexToNumber, nonNullable } from "@/utils";
import { index_account_v2 } from "@/indexes/account-v2";
import { index_block_number_tx_index_v2 } from "@/indexes/block-number-tx-index-v2";
import {
	getDeduplicatedEvents,
	getEventSuccess,
	getTxReceiptForLog,
	createId,
	getPartition,
	getPartitions,
	parseId,
} from "@/helpers";

export interface Erc20ApprovalV2 {
	tag: "erc20_approval_v2";
	id: string;
	success: boolean;
	quantity: string;
	owner_address: `0x${string}`;
	spender_address: `0x${string}`;
	token_address: `0x${string}`;
}

// CREATE TABLE event_erc20_approval_v2 (
//     `id` FixedString(16),
//     `partition` UInt32,
//     `success` Bool,
//     `quantity` UInt256,
//     `owner_address` FixedString(20),
//     `spender_address` FixedString(20),
//     `token_address` FixedString(20)
// )
// ENGINE = ReplacingMergeTree
// ORDER BY id
// PARTITION BY partition;

const abi = parseAbiItem("event Approval(address indexed owner, address indexed spender, uint256 value)");

export const event = univo.event({
	id: "erc20_approval_v2",

	filters: [{ chain: 1, fromBlock: 0, event: toEventSelector(abi) }],

	handler: (block) => {
		return block.eth_getBlockReceipts
			.flatMap((receipt) => receipt.logs)
			.filter((log) => log.topics[0] === toEventSelector(abi))
			.map((log) => {
				try {
					const { args } = decodeEventLog({ topics: log.topics, data: log.data, strict: true, abi: [abi] });

					const id = createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: tables.erc20_approval_v2,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					const partition = getPartition(block.eth_getBlockByNumber.timestamp);
					const receipt = getTxReceiptForLog(block.eth_getBlockReceipts, log);

					return {
						id,
						partition,
						success: getEventSuccess(receipt),
						owner_address: getAddress(args.owner),
						spender_address: getAddress(args.spender),
						token_address: getAddress(log.address),
						quantity: String(args.value),

						// Used for indexes
						chain: hexToNumber(block.eth_chainId),
						tx_index: hexToNumber(receipt.transactionIndex),
						block_number: hexToNumber(block.eth_getBlockByNumber.number),
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
					toUInt256('${event.quantity}'),
					unhex('${event.owner_address.slice(2)}'),
					unhex('${event.spender_address.slice(2)}'),
					unhex('${event.token_address.slice(2)}')
				)`;
			});

			await db.command({
				query: `INSERT INTO event_erc20_approval_v2 (id, partition, success, quantity, owner_address, spender_address, token_address) VALUES ${values.join(",")}`,
			});
		},

		async delete(batch) {
			await db.command({
				query: `DELETE FROM event_erc20_approval_v2 WHERE ${getPartitions(batch.map((event) => event.id)).join(" OR ")}`,
			});
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_tx_index_v2,
	id: "erc20_approval_v2_index_block_number_tx_index_v2",
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
	id: "erc20_approval_v2_index_account_v2",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.token_address }, //
				{ event_id: event.id, account: event.spender_address }, //
				{ event_id: event.id, account: event.owner_address }, //
			];
		});
	},
});

export async function getErc20ApprovalV2(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === tables.erc20_approval_v2);

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
				concat('0x', lower(hex(owner_address))) as owner_address,
				concat('0x', lower(hex(spender_address))) as spender_address,
				concat('0x', lower(hex(token_address))) as token_address
			FROM event_erc20_approval_v2
			WHERE ${partitions.join(" OR ")};
		`,
		format: "JSONEachRow",
	});

	const rows: any[] = await res.json();

	const events = rows.map<Erc20ApprovalV2>((row) => {
		return {
			tag: "erc20_approval_v2",
			id: row["lower(hex(id))"] as string,
			success: row.success as boolean,
			quantity: row.quantity as string,
			owner_address: getAddress(row.owner_address),
			spender_address: getAddress(row.spender_address),
			token_address: getAddress(row.token_address),
		};
	});

	return getDeduplicatedEvents(events);
}
