import { asc, inArray, sql } from "drizzle-orm";
import { decodeFunctionData, getAddress, parseAbiItem, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v3 } from "@/indexes/account-v3";
import { createId, getEventSuccess, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface IntentEnsNameRegisteredV1 {
	tag: "intent_ens_name_registered_v1";
	id: string;
	success: boolean;
	name: string;
	duration: `0x${string}`;
	owner_address: `0x${string}`;
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
	id: "intent_ens_name_registered_v1",

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
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
			try {
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
				} else if (
					isHexEqual(tx.to, ENS_REGISTRAR_CONTROLLER_V3_ADDRESS) &&
					tx.input.startsWith(toFunctionSelector(V3_REGISTER_ABI))
				) {
					abi = V3_REGISTER_ABI;
				} else {
					return [];
				}

				const { args } = decodeFunctionData({ abi: [abi], data: tx.input });
				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionHash, tx.hash));

				const id = createId({
					logIndex: TRANSACTION_EVENT,
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_ens_name_registered_v1,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				return {
					id,
					name: args[0],
					duration: numberToHex(args[2]),
					success: getEventSuccess(receipt),
					owner_address: getAddress(args[1]),

					// Used for indexes
					controller_address: getAddress(tx.to),
					sender_address: getAddress(tx.from),
				};
			} catch {
				return [];
			}
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
							name: sql.raw(`excluded.${table.name.name}`),
							success: sql.raw(`excluded.${table.success.name}`),
							duration: sql.raw(`excluded.${table.duration.name}`),
							owner_address: sql.raw(`excluded.${table.owner_address.name}`),
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
	id: "intent_ens_name_registered_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_ens_name_registered_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.controller_address },
				{ event_id: event.id, account: event.sender_address },
				{ event_id: event.id, account: event.owner_address },
			];
		});
	},
});

export async function getIntentEnsNameRegisteredV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_ens_name_registered_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentEnsNameRegisteredV1>((result) => {
		return {
			tag: "intent_ens_name_registered_v1" as const,
			id: result.id,
			name: result.name,
			success: result.success,
			duration: result.duration,
			owner_address: getAddress(result.owner_address),
		};
	});
}
