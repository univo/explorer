import { and, asc, inArray } from "drizzle-orm";
import { decodeFunctionData, getAddress, hexToNumber, parseAbiItem, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { inTuple } from "@/db/types";
import type { Id } from "@/events";
import { getEventSuccess } from "@/helpers";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v4 } from "@/indexes/index_account_v4";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface IntentEnsNameRegisteredV2 {
	tag: "intent_ens_name_registered_v2";
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	success: boolean;
	name: string;
	duration: `0x${string}`;
	owner_address: `0x${string}`;
	sender_address: `0x${string}`;
	controller_address: `0x${string}`;
}

export const ENS_REGISTRAR_CONTROLLER_V2_DEPLOYED_BLOCK = 9380471;
export const ENS_REGISTRAR_CONTROLLER_V2_ADDRESS = getAddress("0x283af0b28c62c092c9727f1ee09c02ca627eb7f5");
export const ENS_REGISTRAR_CONTROLLER_V3_ADDRESS = getAddress("0x253553366da8546fc250f225fe3d25d0c782303b");

const V2_REGISTER_ABI = parseAbiItem("function register(string name, address owner, uint256 duration, bytes32 secret)");

const V2_REGISTER_WITH_CONFIG_ABI = parseAbiItem(
	"function registerWithConfig(string name, address owner, uint256 duration, bytes32 secret, address resolver, address addr)",
);

const V3_REGISTER_ABI = parseAbiItem(
	"function register(string name, address owner, uint256 duration, bytes32 secret, address resolver, bytes[] data, bool reverseRecord, uint16 ownerControlledFuses)",
);

export const event = univo.event({
	id: "intent_ens_name_registered_v2",

	filters: [
		{
			chain: 1,
			address: ENS_REGISTRAR_CONTROLLER_V2_ADDRESS,
			fromBlock: ENS_REGISTRAR_CONTROLLER_V2_DEPLOYED_BLOCK,
		},
		{
			chain: 1,
			address: ENS_REGISTRAR_CONTROLLER_V3_ADDRESS,
			fromBlock: ENS_REGISTRAR_CONTROLLER_V2_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap<IntentEnsNameRegisteredV2>((tx) => {
			try {
				// When deploying a contract the `to` field is null
				if (tx.to === null) {
					return [];
				}

				let abi: typeof V2_REGISTER_ABI | typeof V2_REGISTER_WITH_CONFIG_ABI | typeof V3_REGISTER_ABI;

				if (isHexEqual(tx.to, ENS_REGISTRAR_CONTROLLER_V2_ADDRESS)) {
					if (tx.input.startsWith(toFunctionSelector(V2_REGISTER_ABI))) {
						abi = V2_REGISTER_ABI;
					} else if (tx.input.startsWith(toFunctionSelector(V2_REGISTER_WITH_CONFIG_ABI))) {
						abi = V2_REGISTER_WITH_CONFIG_ABI;
					} else {
						return [];
					}
				} else if (isHexEqual(tx.to, ENS_REGISTRAR_CONTROLLER_V3_ADDRESS) && tx.input.startsWith(toFunctionSelector(V3_REGISTER_ABI))) {
					abi = V3_REGISTER_ABI;
				} else {
					return [];
				}

				const { args } = decodeFunctionData({ abi: [abi], data: tx.input });
				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionIndex, tx.transactionIndex));

				return {
					tag: "intent_ens_name_registered_v2",
					chain: hexToNumber(block.eth_chainId),
					log_index: hexToNumber(TRANSACTION_EVENT),
					tx_index: hexToNumber(tx.transactionIndex),
					block_number: hexToNumber(block.eth_getBlockByNumber.number),
					block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
					name: args[0],
					duration: numberToHex(args[2]),
					success: getEventSuccess(receipt),
					owner_address: getAddress(args[1]),
					sender_address: getAddress(tx.from),
					controller_address: getAddress(tx.to),
				};
			} catch {
				return [];
			}
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
	id: "intent_ens_name_registered_v2_index_block_number_tx_index_v4",
});

univo.event({
	filters: event.filters,
	storage: index_account_v4,
	id: "intent_ens_name_registered_v2_index_account_v4",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event, account: event.owner_address },
				{ event, account: event.sender_address },
				{ event, account: event.controller_address },
			];
		});
	},
});

export async function getIntentEnsNameRegisteredV2(ids: Id[]) {
	const filtered = ids.filter((id) => TABLES[id.tag] === TABLES.intent_ens_name_registered_v2);

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
					filtered.map((id) => id.block_timestamp),
				),
				inTuple(
					[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
					filtered.map((id) => [id.block_timestamp, id.block_number, id.tx_index, id.log_index, id.chain]),
				),
			),
		)
		.orderBy(asc(table.block_timestamp), asc(table.block_number), asc(table.tx_index), asc(table.log_index), asc(table.chain));

	return rows.map<IntentEnsNameRegisteredV2>((row) => {
		return {
			tag: "intent_ens_name_registered_v2",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			name: row.name,
			success: row.success,
			duration: row.duration,
			owner_address: getAddress(row.owner_address),
			sender_address: getAddress(row.sender_address),
			controller_address: getAddress(row.controller_address),
		};
	});
}
