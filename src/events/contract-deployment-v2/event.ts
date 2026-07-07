import { getAddress } from "viem";

import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { hexToNumber, nonNullable } from "@/utils";
import { index_account_v2 } from "@/indexes/account-v2";
import { index_block_number_tx_index_v2 } from "@/indexes/block-number-tx-index-v2";
import { getDeduplicatedEvents, getEventSuccess, createId, getPartition, getPartitions, parseId } from "@/helpers";

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

export const event = univo.event({
	id: "contract_deployment_v2",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockReceipts
			.map((receipt) => {
				if (receipt.contractAddress === null || receipt.contractAddress === undefined) return null;

				const id = createId({
					logIndex: "0x0",
					chainId: block.eth_chainId,
					txIndex: receipt.transactionIndex,
					tableId: tables.contract_deployment_v2,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const partition = getPartition(block.eth_getBlockByNumber.timestamp);

				return {
					id,
					partition,
					success: getEventSuccess(receipt),
					deployer_address: getAddress(receipt.from),
					contract_address: getAddress(receipt.contractAddress),

					// Used for indexes
					chain: hexToNumber(block.eth_chainId),
					tx_index: hexToNumber(receipt.transactionIndex),
					block_number: hexToNumber(block.eth_getBlockByNumber.number),
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
				query: `DELETE FROM event_contract_deployment_v2 WHERE ${getPartitions(batch.map((event) => event.id)).join(" OR ")}`,
			});
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_tx_index_v2,
	id: "contract_deployment_v2_index_block_number_tx_index_v2",
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
	id: "contract_deployment_v2_index_account_v2",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.contract_address }, //
				{ event_id: event.id, account: event.deployer_address }, //
			];
		});
	},
});

export async function getContractDeploymentV2(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === tables.contract_deployment_v2);

	if (filtered.length === 0) {
		return [];
	}

	const partitions = getPartitions(filtered);

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
