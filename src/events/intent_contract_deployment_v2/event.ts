import { and, asc, inArray } from "drizzle-orm";
import { getAddress, hexToNumber } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { inTuple } from "@/db/types";
import type { Event } from "@/events";
import { getEventSuccess } from "@/helpers";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v4 } from "@/indexes/index_account_v4";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface IntentContractDeploymentV2 {
	tag: "intent_contract_deployment_v2";
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	success: boolean;
	contract_address: `0x${string}`;
	deployer_address: `0x${string}`;
}

export const event = univo.event({
	id: "intent_contract_deployment_v2",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockReceipts.flatMap<IntentContractDeploymentV2>((receipt) => {
			if (receipt.contractAddress === null || receipt.contractAddress === undefined) {
				return [];
			}

			return {
				tag: "intent_contract_deployment_v2",
				chain: hexToNumber(block.eth_chainId),
				log_index: hexToNumber(TRANSACTION_EVENT),
				tx_index: hexToNumber(receipt.transactionIndex),
				block_number: hexToNumber(block.eth_getBlockByNumber.number),
				block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
				success: getEventSuccess(receipt),
				deployer_address: getAddress(receipt.from),
				contract_address: getAddress(receipt.contractAddress),
			};
		});
	},

	storage: {
		async upsert(events) {
			const MAX_BATCH_SIZE = 4000;
			const client = await createPostgresClient();

			for (let i = 0; i < events.length; i += MAX_BATCH_SIZE) {
				await client.insert(table).values(events.slice(i, i + MAX_BATCH_SIZE));
			}
		},

		async delete(events) {
			const client = await createPostgresClient();

			await client.delete(table).where(
				and(
					inArray(
						table.block_timestamp,
						events.map((event) => event.block_timestamp),
					),
					inTuple(
						[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
						events.map((event) => [event.block_timestamp, event.block_number, event.tx_index, event.log_index, event.chain]),
					),
				),
			);
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_tx_index_v4,
	handler: (block) => event.handler(block),
	id: "intent_contract_deployment_v2_index_block_number_tx_index_v4",
});

univo.event({
	filters: event.filters,
	storage: index_account_v4,
	id: "intent_contract_deployment_v2_index_account_v4",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event, account: event.contract_address }, //
				{ event, account: event.deployer_address },
			];
		});
	},
});

export async function getIntentContractDeploymentV2(events: Event[]) {
	const filtered = events.filter((event) => TABLES[event.tag] === TABLES.intent_contract_deployment_v2);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.selectDistinct()
		.from(table)
		.where(
			and(
				inArray(
					table.block_timestamp,
					filtered.map((event) => event.block_timestamp),
				),
				inTuple(
					[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
					filtered.map((event) => [event.block_timestamp, event.block_number, event.tx_index, event.log_index, event.chain]),
				),
			),
		)
		.orderBy(asc(table.block_timestamp), asc(table.block_number), asc(table.tx_index), asc(table.log_index), asc(table.chain));

	return rows.map<IntentContractDeploymentV2>((row) => {
		return {
			tag: "intent_contract_deployment_v2",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			success: row.success,
			deployer_address: getAddress(row.deployer_address),
			contract_address: getAddress(row.contract_address),
		};
	});
}
