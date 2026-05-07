import { decodeEventLog, getAddress, parseAbiItem, toEventSelector } from "viem";

import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { nonNullable } from "@/utils";
import { index_account_v1 } from "@/indexes/account-v1";
import { index_tx_hash_v1 } from "@/indexes/tx-hash-v1";
import { index_block_number_v2 } from "@/indexes/block-number-v2";
import { createId, getDeduplicatedEvents, getEventSuccess, getTxReceiptForLog, parseId } from "@/helpers";

export interface Erc20TransferV1 {
	tag: "erc20_transfer_v1";
	id: string;
	success: boolean;
	quantity: string;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
	token_address: `0x${string}`;
}

// CREATE TABLE event_erc20_transfer_v1 (
//     `id` FixedString(36),
//     `success` Bool,
//     `quantity` UInt256,
//     `to_address` FixedString(42),
//     `from_address` FixedString(42),
//     `token_address` FixedString(42),
// )
// ENGINE = ReplacingMergeTree
// ORDER BY (id);

const abi = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");

const event = univo.event({
	id: "erc20_transfer_v1",

	filters: [{ chain: 1, fromBlock: 0, event: toEventSelector(abi) }],

	handler: (block) => {
		return block.eth_getBlockReceipts
			.flatMap((receipt) => receipt.logs)
			.filter((log) => log.topics[0] === toEventSelector(abi))
			.map((log) => {
				try {
					const { args } = decodeEventLog({ topics: log.topics, data: log.data, strict: true, abi: [abi] });

					// Only record non-zero transfers
					if (args.value === 0n) return;

					const id = createId({
						log_index: log.logIndex,
						chain_id: block.eth_chainId,
						tx_index: log.transactionIndex,
						table_id: tables.erc20_transfer_v1,
						block_number: block.eth_getBlockByHash.number,
						block_timestamp: block.eth_getBlockByHash.timestamp,
					});

					const receipt = getTxReceiptForLog(block.eth_getBlockReceipts, log);

					return {
						id,
						success: getEventSuccess(receipt),
						to_address: getAddress(args.to),
						from_address: getAddress(args.from),
						token_address: getAddress(log.address),
						quantity: String(args.value),
						// Used for indexing
						tx_hash: receipt.transactionHash,
						block_number: Number(block.eth_getBlockByHash.number),
					};
				} catch (error) {
					return null;
				}
			})
			.filter(nonNullable);
	},

	storage: {
		async upsert(batch) {
			await db.insert({
				table: "event_erc20_transfer_v1",
				format: "JSONEachRow",
				values: batch.map((value) => ({
					id: value.id,
					success: value.success,
					quantity: value.quantity,
					to_address: value.to_address,
					from_address: value.from_address,
					token_address: value.token_address,
				})),
			});
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_account_v1,
	id: "erc20_transfer_v1_index_account_v1",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, account: event.to_address },
			{ id: event.id, account: event.from_address },
			{ id: event.id, account: event.token_address },
		]);
	},
});

univo.event({
	filters: event.filters,
	storage: index_tx_hash_v1,
	id: "erc20_transfer_v1_index_tx_hash_v1",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, tx_hash: event.tx_hash }, //
		]);
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_v2,
	id: "erc20_transfer_v1_index_block_number_v2",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, block_number: event.block_number }, //
		]);
	},
});

export async function getErc20TransferV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).table_id === tables.erc20_transfer_v1);

	if (filtered.length === 0) return [];

	const mapped = filtered.map((id) => `'${id}'`);

	const res = await db.query({
		query: `SELECT id, success, toString(quantity) as quantity, to_address, from_address, token_address FROM event_erc20_transfer_v1 WHERE id IN (${mapped.join(",")});`,
		format: "JSONEachRow",
	});

	const rows: any[] = await res.json();

	const events = rows.map<Erc20TransferV1>((row) => {
		return {
			tag: "erc20_transfer_v1",
			id: row.id as string,
			success: row.success as boolean,
			quantity: row.quantity as string,
			to_address: row.to_address as `0x${string}`,
			from_address: row.from_address as `0x${string}`,
			token_address: row.token_address as `0x${string}`,
		};
	});

	return getDeduplicatedEvents(events);
}
