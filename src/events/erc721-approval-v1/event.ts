import { decodeEventLog, getAddress, parseAbiItem, toEventSelector } from "viem";

import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { nonNullable } from "@/utils";
import { index_account_v1 } from "@/indexes/account-v1";
import { index_tx_hash_v1 } from "@/indexes/tx-hash-v1";
import { index_block_number_v2 } from "@/indexes/block-number-v2";
import { createId, getDeduplicatedEvents, getEventSuccess, parseId } from "@/helpers";

export interface Erc721ApprovalV1 {
	tag: "erc721_approval_v1";
	id: string;
	success: boolean;
	token_id: string;
	owner_address: `0x${string}`;
	spender_address: `0x${string}`;
	token_address: `0x${string}`;
}

// CREATE TABLE event_erc721_approval_v1 (
//     `id` FixedString(36),
//     `success` Bool,
//     `token_id` UInt256,
//     `owner_address` FixedString(42),
//     `spender_address` FixedString(42),
//     `token_address` FixedString(42),
// )
// ENGINE = ReplacingMergeTree
// ORDER BY (id);

const abi = parseAbiItem("event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)");

const event = univo.event({
	id: "erc721_approval_v1",

	filters: [{ chain: 1, fromBlock: 0, event: toEventSelector(abi) }],

	handler: (block) => {
		return block.eth_getBlockReceipts
			.flatMap((receipt) => receipt.logs)
			.filter((log) => log.topics[0] === toEventSelector(abi))
			.map((log) => {
				try {
					const { args } = decodeEventLog({ topics: log.topics, data: log.data, strict: true, abi: [abi] });

					const id = createId({
						log_index: log.logIndex,
						chain_id: block.eth_chainId,
						tx_index: log.transactionIndex,
						table_id: tables.erc721_approval_v1,
						block_number: block.eth_getBlockByHash.number,
						block_timestamp: block.eth_getBlockByHash.timestamp,
					});

					const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === log.transactionHash);

					return {
						id,
						success: getEventSuccess(receipt),
						owner_address: getAddress(args.owner),
						spender_address: getAddress(args.approved),
						token_address: getAddress(log.address),
						token_id: String(args.tokenId),
						// Used for indexing
						tx_hash: log.transactionHash,
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
				table: "event_erc721_approval_v1",
				format: "JSONEachRow",
				values: batch.map((value) => ({
					id: value.id,
					success: value.success,
					token_id: value.token_id,
					owner_address: value.owner_address,
					spender_address: value.spender_address,
					token_address: value.token_address,
				})),
			});
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_account_v1,
	id: "erc721_approval_v1_index_account_v1",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, account: event.owner_address },
			{ id: event.id, account: event.spender_address },
			{ id: event.id, account: event.token_address },
		]);
	},
});

univo.event({
	filters: event.filters,
	storage: index_tx_hash_v1,
	id: "erc721_approval_v1_index_tx_hash_v1",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, tx_hash: event.tx_hash }, //
		]);
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_v2,
	id: "erc721_approval_v1_index_block_number_v2",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, block_number: event.block_number }, //
		]);
	},
});

export async function getErc721ApprovalV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).table_id === tables.erc721_approval_v1);

	if (filtered.length === 0) return [];

	const mapped = filtered.map((id) => `'${id}'`);

	const res = await db.query({
		query: `SELECT id, success, toString(token_id) as token_id, owner_address, spender_address, token_address FROM event_erc721_approval_v1 WHERE id IN (${mapped.join(",")});`,
		format: "JSONEachRow",
	});

	const rows: any[] = await res.json();

	const events = rows.map<Erc721ApprovalV1>((row) => {
		return {
			tag: "erc721_approval_v1",
			id: row.id as string,
			success: row.success as boolean,
			token_id: row.token_id as string,
			owner_address: row.owner_address as `0x${string}`,
			spender_address: row.spender_address as `0x${string}`,
			token_address: row.token_address as `0x${string}`,
		};
	});

	return getDeduplicatedEvents(events);
}
