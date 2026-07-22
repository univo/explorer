import { getAddress } from "viem";
import { asc, inArray, sql } from "drizzle-orm";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { nonNullable } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_account_v3 } from "@/indexes/account-v3";
import { getEventSuccess, createId, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface ContractDeploymentV3 {
	tag: "contract_deployment_v3";
	id: string;
	success: boolean;
	contract_address: `0x${string}`;
	deployer_address: `0x${string}`;
}

export const event = univo.event({
	id: "contract_deployment_v3",

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

				return {
					id,
					success: getEventSuccess(receipt),
					deployer_address: getAddress(receipt.from),
					contract_address: getAddress(receipt.contractAddress),
				};
			})
			.filter(nonNullable);
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
							contract_address: sql.raw(`excluded.${table.contract_address.name}`),
							deployer_address: sql.raw(`excluded.${table.deployer_address.name}`),
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
	storage: index_block_number_tx_index_v4,
	id: "contract_deployment_v3_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "contract_deployment_v3_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.contract_address }, //
				{ event_id: event.id, account: event.deployer_address },
			];
		});
	},
});

export async function getContractDeploymentV3(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === tables.contract_deployment_v2);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client.select().from(table).where(inArray(table.id, filtered)).orderBy(asc(table.id));

	return rows.map<ContractDeploymentV3>((result) => {
		return {
			tag: "contract_deployment_v3" as const,
			id: result.id,
			success: result.success,
			deployer_address: getAddress(result.deployer_address),
			contract_address: getAddress(result.contract_address),
		};
	});
}
