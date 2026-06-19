import { decodeEventLog, getAddress, toEventSelector } from "viem";

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

export interface EnsNameRegisteredV2 {
	tag: "ens_name_registered_v2";
	id: string;
	success: boolean;
	name: string;
	cost_eth: string;
	owner_address: `0x${string}`;
	expires_at: number;
}

// CREATE TABLE event_ens_name_registered_v2 (
//     `id` FixedString(16),
//     `partition` UInt32,
//     `success` Bool,
//     `name` String,
//     `cost_eth` UInt256,
//     `owner_address` FixedString(20),
//     `expires_at` DateTime64(3)
// )
// ENGINE = ReplacingMergeTree
// ORDER BY id
// PARTITION BY partition;

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
	id: "ens_name_registered_v2",

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

						const id = v2_createId({
							logIndex: log.logIndex,
							chainId: block.eth_chainId,
							txIndex: log.transactionIndex,
							tableId: tables.ens_name_registered_v2,
							blockNumber: block.eth_getBlockByNumber.number,
							blockTimestamp: block.eth_getBlockByNumber.timestamp,
						});

						return {
							id,
							partition: v2_getPartition(block.eth_getBlockByNumber.timestamp),
							success: getEventSuccess(receipt),
							name: args.name,
							owner_address: getAddress(args.owner),
							cost_eth: String(args.cost),
							expires_at: Number(args.expires) * 1000,
						};
					}

					if (log.topics[0] === toEventSelector(v3)) {
						const { args } = decodeEventLog({ data: log.data, topics: log.topics, strict: true, abi: [v3] });

						const id = v2_createId({
							logIndex: log.logIndex,
							chainId: block.eth_chainId,
							txIndex: log.transactionIndex,
							tableId: tables.ens_name_registered_v2,
							blockNumber: block.eth_getBlockByNumber.number,
							blockTimestamp: block.eth_getBlockByNumber.timestamp,
						});

						return {
							id,
							partition: v2_getPartition(block.eth_getBlockByNumber.timestamp),
							success: getEventSuccess(receipt),
							name: args.name,
							owner_address: getAddress(args.owner),
							cost_eth: String(args.baseCost + args.premium),
							expires_at: Number(args.expires) * 1000,
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
			if (batch.length === 0) {
				return;
			}

			const values = batch.map((event) => {
				return `(
					unhex('${event.id}'),
					${event.partition},
					${event.success},
					${escapeChars(event.name)},
					toUInt256('${event.cost_eth}'),
					unhex('${event.owner_address.slice(2)}'),
					fromUnixTimestamp64Milli(${event.expires_at})
				)`;
			});

			await db.command({
				query: `INSERT INTO event_ens_name_registered_v2 (id, partition, success, name, cost_eth, owner_address, expires_at) VALUES ${values.join(",")}`,
			});
		},

		async delete(batch) {
			await db.command({
				query: `DELETE FROM event_ens_name_registered_v2 WHERE ${v2_getPartitions(batch.map((event) => event.id)).join(" OR ")}`,
			});
		},
	},
});

function escapeChars(value: string) {
	return `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'").replaceAll("\n", "\\n").replaceAll("\r", "\\r").replaceAll("\t", "\\t")}'`;
}

export async function getEnsNameRegisteredV2(ids: string[]) {
	const filtered = ids.filter((id) => v2_parseId(id).tableId === tables.ens_name_registered_v2);

	if (filtered.length === 0) {
		return [];
	}

	const partitions = v2_getPartitions(filtered);

	const res = await db.query({
		query: `
			SELECT
				lower(hex(id)),
				success,
				name,
				toString(cost_eth) as cost_eth,
				concat('0x', lower(hex(owner_address))) as owner_address,
				toUnixTimestamp64Milli(expires_at) as expires_at
			FROM event_ens_name_registered_v2
			WHERE ${partitions.join(" OR ")};
		`,
		format: "JSONEachRow",
	});

	const rows: any[] = await res.json();

	const events = rows.map<EnsNameRegisteredV2>((row) => {
		return {
			tag: "ens_name_registered_v2",
			id: row["lower(hex(id))"] as string,
			success: row.success as boolean,
			name: row.name as string,
			cost_eth: row.cost_eth as string,
			owner_address: getAddress(row.owner_address),
			expires_at: Number(row.expires_at),
		};
	});

	return getDeduplicatedEvents(events);
}
