import { decodeEventLog, getAddress, toEventSelector } from "viem";

import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { nonNullable } from "@/utils";
import { index_account_v1 } from "@/indexes/account-v1";
import { index_tx_hash_v1 } from "@/indexes/tx-hash-v1";
import { index_block_number_v2 } from "@/indexes/block-number-v2";
import { createId, getDeduplicatedEvents, getEventSuccess, parseId } from "@/helpers";

// Is there an example where the account registered `tx.from` is different to the owner address?
// In that case we'd need to record the account that registers the ENS because they are the originator of the action.

// 0x405f2c36d01fee525915298f543a2e1b13466e5bfb4042f76313f9fe062cfff8

export interface EnsNameRegisteredV1 {
	tag: "ens_name_registered_v1";
	id: string;
	success: boolean;
	name: string;
	cost_eth: string;
	owner_address: `0x${string}`;
	expires_at: number;
}

// CREATE TABLE event_ens_name_registered_v1 (
//     `id` FixedString(36),
//     `success` Bool,
//     `name` String,
//     `cost_eth` String,
//     `owner_address` FixedString(42),
//     `expires_at` DateTime64(3),
// )
// ENGINE = ReplacingMergeTree
// ORDER BY (id);

const v2 = {
	type: "event",
	anonymous: false,
	name: "NameRegistered",
	inputs: [
		{ indexed: false, internalType: "string", name: "name", type: "string" },
		{ indexed: true, internalType: "bytes32", name: "label", type: "bytes32" },
		{ indexed: true, internalType: "address", name: "owner", type: "address" },
		{ indexed: false, internalType: "uint256", name: "cost", type: "uint256" },
		{ indexed: false, internalType: "uint256", name: "expires", type: "uint256" },
	],
} as const;

const v3 = {
	type: "event",
	anonymous: false,
	name: "NameRegistered",
	inputs: [
		{ indexed: false, internalType: "string", name: "name", type: "string" },
		{ indexed: true, internalType: "bytes32", name: "label", type: "bytes32" },
		{ indexed: true, internalType: "address", name: "owner", type: "address" },
		{ indexed: false, internalType: "uint256", name: "baseCost", type: "uint256" },
		{ indexed: false, internalType: "uint256", name: "premium", type: "uint256" },
		{ indexed: false, internalType: "uint256", name: "expires", type: "uint256" },
	],
} as const;

const event = univo.event({
	id: "ens_name_registered_v1",

	filters: [
		{
			chain: 1,
			fromBlock: 0,
			event: toEventSelector(v2),
			address: "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5", // v2 registrar
		},
		{
			chain: 1,
			fromBlock: 0,
			event: toEventSelector(v3),
			address: "0x253553366da8546fc250f225fe3d25d0c782303b", // v3 registrar
		},
	],

	handler(block) {
		return block.eth_getBlockReceipts.flatMap((receipt) => {
			const logs = receipt.logs.map((log) => {
				if (receipt.to === null) return null;

				try {
					if (log.topics[0] === toEventSelector(v2)) {
						const { args } = decodeEventLog({ data: log.data, topics: log.topics, strict: true, abi: [v2] });

						const id = createId({
							log_index: log.logIndex,
							chain_id: block.eth_chainId,
							tx_index: log.transactionIndex,
							table_id: tables.ens_name_registered_v1,
							block_number: block.eth_getBlockByNumber.number,
							block_timestamp: block.eth_getBlockByNumber.timestamp,
						});

						return {
							id,
							success: getEventSuccess(receipt),
							name: args.name,
							owner_address: getAddress(args.owner),
							cost_eth: String(args.cost),
							expires_at: Number(args.expires) * 1000,
							// Additional addresses for indexing
							receipt_to: receipt.to,
							log_address: log.address,
							receipt_from: receipt.from,
							tx_hash: receipt.transactionHash,
							block_number: Number(block.eth_getBlockByNumber.number),
						};
					}

					if (log.topics[0] === toEventSelector(v3)) {
						const { args } = decodeEventLog({ data: log.data, topics: log.topics, strict: true, abi: [v3] });

						const id = createId({
							log_index: log.logIndex,
							chain_id: block.eth_chainId,
							tx_index: log.transactionIndex,
							table_id: tables.ens_name_registered_v1,
							block_number: block.eth_getBlockByNumber.number,
							block_timestamp: block.eth_getBlockByNumber.timestamp,
						});

						return {
							id,
							success: getEventSuccess(receipt),
							name: args.name,
							owner_address: getAddress(args.owner),
							cost_eth: String(args.baseCost + args.premium),
							expires_at: Number(args.expires) * 1000,
							// Additional addresses for indexing
							receipt_to: receipt.to,
							log_address: log.address,
							receipt_from: receipt.from,
							tx_hash: receipt.transactionHash,
							block_number: Number(block.eth_getBlockByNumber.number),
						};
					}
				} catch {
					return null;
				}
			});

			return logs.filter(nonNullable);
		});
	},

	storage: {
		async upsert(batch) {
			await db.insert({
				table: "event_ens_name_registered_v1",
				format: "JSONEachRow",
				values: batch.map((value) => ({
					id: value.id,
					success: value.success,
					name: value.name,
					cost_eth: value.cost_eth,
					owner_address: value.owner_address,
					expires_at: value.expires_at,
				})),
			});
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_account_v1,
	id: "ens_name_registered_v1_index_account_v1",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, account: event.owner_address },
			{ id: event.id, account: event.receipt_to },
			{ id: event.id, account: event.log_address },
			{ id: event.id, account: event.receipt_from },
		]);
	},
});

univo.event({
	filters: event.filters,
	storage: index_tx_hash_v1,
	id: "ens_name_registered_v1_index_tx_hash_v1",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, tx_hash: event.tx_hash }, //
		]);
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_v2,
	id: "ens_name_registered_v1_index_block_number_v2",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, block_number: event.block_number }, //
		]);
	},
});

export async function getEnsNameRegisteredV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).table_id === tables.ens_name_registered_v1);

	if (filtered.length === 0) return [];

	const mapped = filtered.map((id) => `'${id}'`);

	const res = await db.query({
		query: `SELECT * from event_ens_name_registered_v1 WHERE id IN (${mapped.join(",")})`,
		format: "JSONEachRow",
	});

	const rows: any[] = await res.json();

	const events = rows.map<EnsNameRegisteredV1>((row) => {
		return {
			tag: "ens_name_registered_v1",
			id: row.id as string,
			success: row.success as boolean,
			name: row.name as string,
			cost_eth: row.cost_eth as string,
			owner_address: row.owner_address as `0x${string}`,
			expires_at: new Date(row.expires_at as string).getTime(),
		};
	});

	return getDeduplicatedEvents(events);
}
