import { and, asc, inArray } from "drizzle-orm";
import { getAddress, hexToNumber } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { inTuple } from "@/db/types";
import { numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_account_v4 } from "@/indexes/index_account_v4";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { getEventSuccess, createId, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface IntentContractDeploymentV2 {
	tag: "intent_contract_deployment_v2";
	id: string;
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

			const id = createId({
				chainId: block.eth_chainId,
				logIndex: TRANSACTION_EVENT,
				txIndex: receipt.transactionIndex,
				tableId: TABLES.intent_contract_deployment_v2,
				blockNumber: block.eth_getBlockByNumber.number,
				blockTimestamp: block.eth_getBlockByNumber.timestamp,
			});

			return {
				tag: "intent_contract_deployment_v2",
				id,
				log_index: hexToNumber(TRANSACTION_EVENT),
				chain: hexToNumber(block.eth_chainId),
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
	id: "intent_contract_deployment_v2_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v4,
	id: "intent_contract_deployment_v2_index_account_v4",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.contract_address }, //
				{ event_id: event.id, account: event.deployer_address },
			];
		});
	},
});

export async function getIntentContractDeploymentV2(ids: string[]) {
	const mapped = ids.map((id) => parseId(id));
	const filtered = mapped.filter((id) => id.tableId === TABLES.intent_contract_deployment_v2);

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
					filtered.map((event) => new Date(event.blockTimestamp * 1000)),
				),
				inTuple(
					[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
					filtered.map((event) => [new Date(event.blockTimestamp * 1000), event.blockNumber, event.txIndex, event.logIndex, event.chainId]),
				),
			),
		)
		.orderBy(asc(table.block_timestamp), asc(table.block_number), asc(table.tx_index), asc(table.log_index), asc(table.chain));

	return rows.map<IntentContractDeploymentV2>((row) => {
		const id = createId({
			chainId: numberToHex(row.chain),
			txIndex: numberToHex(row.tx_index),
			tableId: TABLES.intent_contract_deployment_v2,
			logIndex: numberToHex(row.log_index),
			blockNumber: numberToHex(row.block_number),
			blockTimestamp: numberToHex(row.block_timestamp.getTime() / 1000),
		});

		return {
			tag: "intent_contract_deployment_v2",
			id,
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
