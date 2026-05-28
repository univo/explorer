import { getAddress } from "viem";

import { db } from "@/db/client";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { nonNullable } from "@/utils";
import { index_account_v1 } from "@/indexes/account-v1";
import { index_tx_hash_v1 } from "@/indexes/tx-hash-v1";
import { index_block_number_v2 } from "@/indexes/block-number-v2";
import { createId, getDeduplicatedEvents, getEventSuccess, parseId } from "@/helpers";

export interface ContractDeploymentV1 {
	tag: "contract_deployment_v1";
	id: string;
	success: boolean;
	contract_address: `0x${string}`;
	deployer_address: `0x${string}`;
}

// CREATE TABLE event_contract_deployment_v1 (
//     `id` FixedString(36),
//     `success` Bool,
//     `contract_address` FixedString(42),
//     `deployer_address` FixedString(42),
// )
// ENGINE = ReplacingMergeTree
// ORDER BY (id);

const event = univo.event({
	id: "contract_deployment_v1",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockReceipts
			.map((receipt) => {
				if (receipt.contractAddress === null || receipt.contractAddress === undefined) return null;

				const id = createId({
					log_index: "0x0",
					chain_id: block.eth_chainId,
					tx_index: receipt.transactionIndex,
					table_id: tables.contract_deployment_v1,
					block_number: block.eth_getBlockByNumber.number,
					block_timestamp: block.eth_getBlockByNumber.timestamp,
				});

				return {
					id,
					success: getEventSuccess(receipt),
					deployer_address: getAddress(receipt.from),
					contract_address: getAddress(receipt.contractAddress),
					// Used for indexing
					tx_hash: receipt.transactionHash,
					block_number: Number(block.eth_getBlockByNumber.number),
				};
			})
			.filter(nonNullable);
	},

	storage: {
		async upsert(batch) {
			await db.insert({
				table: "event_contract_deployment_v1",
				format: "JSONEachRow",
				values: batch.map((value) => ({
					id: value.id,
					success: value.success,
					contract_address: value.contract_address,
					deployer_address: value.deployer_address,
				})),
			});
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_account_v1,
	id: "contract_deployment_v1_index_account_v1",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, account: event.deployer_address },
			{ id: event.id, account: event.contract_address },
		]);
	},
});

univo.event({
	filters: event.filters,
	storage: index_tx_hash_v1,
	id: "contract_deployment_v1_index_tx_hash_v1",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, tx_hash: event.tx_hash }, //
		]);
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_v2,
	id: "contract_deployment_v1_index_block_number_v2",
	handler: (block) => {
		return event.handler(block).flatMap((event) => [
			{ id: event.id, block_number: event.block_number }, //
		]);
	},
});

export async function getContractDeploymentV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).table_id === tables.contract_deployment_v1);

	if (filtered.length === 0) return [];

	const mapped = filtered.map((id) => `'${id}'`);

	const res = await db.query({
		query: `SELECT * from event_contract_deployment_v1 WHERE id IN (${mapped.join(",")});`,
		format: "JSONEachRow",
	});

	const rows: any[] = await res.json();

	const events = rows.map<ContractDeploymentV1>((row) => {
		return {
			tag: "contract_deployment_v1",
			id: row.id as string,
			success: row.success as boolean,
			deployer_address: row.deployer_address as `0x${string}`,
			contract_address: row.contract_address as `0x${string}`,
		};
	});

	return getDeduplicatedEvents(events);
}
