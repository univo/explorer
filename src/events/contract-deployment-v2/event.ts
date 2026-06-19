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

export interface ContractDeploymentV2 {
	tag: "contract_deployment_v2";
	id: string;
	success: boolean;
	contract_address: `0x${string}`;
	deployer_address: `0x${string}`;
}

// CREATE TABLE event_contract_deployment_v2 (
//     `id` FixedString(16),
//     `partition` UInt32,
//     `success` Bool,
//     `contract_address` FixedString(20),
//     `deployer_address` FixedString(20)
// )
// ENGINE = ReplacingMergeTree
// ORDER BY id
// PARTITION BY partition;

univo.event({
	id: "contract_deployment_v2",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockReceipts
			.map((receipt) => {
				if (receipt.contractAddress === null || receipt.contractAddress === undefined) return null;

				const id = v2_createId({
					logIndex: "0x0",
					chainId: block.eth_chainId,
					txIndex: receipt.transactionIndex,
					tableId: tables.contract_deployment_v2,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const partition = v2_getPartition(block.eth_getBlockByNumber.timestamp);

				return {
					id,
					partition,
					success: getEventSuccess(receipt),
					deployer_address: getAddress(receipt.from),
					contract_address: getAddress(receipt.contractAddress),
				};
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
					unhex('${event.contract_address.slice(2)}'),
					unhex('${event.deployer_address.slice(2)}')
				)`;
			});

			await db.command({
				query: `INSERT INTO event_contract_deployment_v2 (id, partition, success, contract_address, deployer_address) VALUES ${values.join(",")}`,
			});
		},

		async delete(batch) {
			await db.command({
				query: `DELETE event_contract_deployment_v2 WHERE ${v2_getPartitions(batch.map((event) => event.id)).join(" OR ")}`,
			});
		},
	},
});

export async function getContractDeploymentV2(ids: string[]) {
	const filtered = ids.filter((id) => v2_parseId(id).tableId === tables.contract_deployment_v2);

	if (filtered.length === 0) {
		return [];
	}

	const partitions = v2_getPartitions(filtered);

	const res = await db.query({
		query: `
			SELECT
				lower(hex(id)),
				success,
				concat('0x', lower(hex(contract_address))) as contract_address,
				concat('0x', lower(hex(deployer_address))) as deployer_address
			FROM event_contract_deployment_v2
			WHERE ${partitions.join(" OR ")};
		`,
		format: "JSONEachRow",
	});

	const rows: any[] = await res.json();

	const events = rows.map<ContractDeploymentV2>((row) => {
		return {
			tag: "contract_deployment_v2",
			id: row["lower(hex(id))"] as string,
			success: row.success as boolean,
			deployer_address: getAddress(row.deployer_address),
			contract_address: getAddress(row.contract_address),
		};
	});

	return getDeduplicatedEvents(events);
}
