import { asc, inArray, sql } from "drizzle-orm";
import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { decodeEventLog, getAddress, toEventSelector } from "viem";

import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { hex, id } from "@/db/schema";
import { nonNullable, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_account_v3 } from "@/indexes/account-v3";
import { getEventSuccess, createId, parseId } from "@/helpers";
import { index_block_number_tx_index_v3 } from "@/indexes/block-number-tx-index-v3";

export interface EnsNameRegisteredV3 {
	tag: "ens_name_registered_v3";
	id: string;
	success: boolean;
	name: string;
	cost_eth: `0x${string}`;
	owner_address: `0x${string}`;
	expires_at: `0x${string}`;
}

const table = pgTable("event_ens_name_registered_v3", {
	id: id().primaryKey(),
	name: text().notNull(),
	cost_eth: hex().notNull(),
	expires_at: hex().notNull(),
	success: boolean().notNull(),
	owner_address: hex().notNull(),
});

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

export const event = univo.event({
	id: "ens_name_registered_v3",

	filters: [
		{
			chain: 1,
			fromBlock: 0,
			event: toEventSelector(v2),
			address: "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5",
		},
		{
			chain: 1,
			fromBlock: 0,
			event: toEventSelector(v3),
			address: "0x253553366da8546fc250f225fe3d25d0c782303b",
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
							logIndex: log.logIndex,
							chainId: block.eth_chainId,
							txIndex: log.transactionIndex,
							tableId: tables.ens_name_registered_v2,
							blockNumber: block.eth_getBlockByNumber.number,
							blockTimestamp: block.eth_getBlockByNumber.timestamp,
						});

						return {
							id,
							success: getEventSuccess(receipt),
							name: args.name,
							owner_address: getAddress(args.owner),
							cost_eth: numberToHex(args.cost),
							expires_at: numberToHex(args.expires),

							// Used for indexes
							receipt_to: getAddress(receipt.to),
							log_address: getAddress(log.address),
							receipt_from: getAddress(receipt.from),
						};
					}

					if (log.topics[0] === toEventSelector(v3)) {
						const { args } = decodeEventLog({ data: log.data, topics: log.topics, strict: true, abi: [v3] });

						const id = createId({
							logIndex: log.logIndex,
							chainId: block.eth_chainId,
							txIndex: log.transactionIndex,
							tableId: tables.ens_name_registered_v2,
							blockNumber: block.eth_getBlockByNumber.number,
							blockTimestamp: block.eth_getBlockByNumber.timestamp,
						});

						return {
							id,
							success: getEventSuccess(receipt),
							name: args.name,
							owner_address: getAddress(args.owner),
							cost_eth: numberToHex(args.baseCost + args.premium),
							expires_at: numberToHex(args.expires),

							// Used for indexes
							receipt_to: getAddress(receipt.to),
							log_address: getAddress(log.address),
							receipt_from: getAddress(receipt.from),
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
							name: sql.raw(`excluded.${table.name.name}`),
							cost_eth: sql.raw(`excluded.${table.cost_eth.name}`),
							owner_address: sql.raw(`excluded.${table.owner_address.name}`),
							expires_at: sql.raw(`excluded.${table.expires_at.name}`),
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
	id: "ens_name_registered_v3_index_block_number_tx_index_v3",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "ens_name_registered_v3_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.receipt_to }, //
				{ event_id: event.id, account: event.log_address },
				{ event_id: event.id, account: event.receipt_from },
				{ event_id: event.id, account: event.owner_address },
			];
		});
	},
});

export async function getEnsNameRegisteredV3(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === tables.ens_name_registered_v2);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client.select().from(table).where(inArray(table.id, filtered)).orderBy(asc(table.id));

	return rows.map<EnsNameRegisteredV3>((result) => {
		return {
			tag: "ens_name_registered_v3" as const,
			id: result.id,
			success: result.success,
			name: result.name,
			cost_eth: result.cost_eth,
			owner_address: getAddress(result.owner_address),
			expires_at: result.expires_at,
		};
	});
}
