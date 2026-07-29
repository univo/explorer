import { asc, inArray, sql } from "drizzle-orm";
import {
	decodeEventLog,
	decodeFunctionData,
	getAddress,
	parseAbiItem,
	toEventSelector,
	toFunctionSelector,
} from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v3 } from "@/indexes/account-v3";
import { getEventSuccess, createId, parseId } from "@/helpers";
import { iife, isHexEqual, nonNullable, numberToHex } from "@/utils";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface EnsNameRegisteredV3 {
	tag: "ens_name_registered_v3";
	id: string;
	success: boolean;
	name: string;
	cost_eth: `0x${string}`;
	expires_at: `0x${string}`;
	owner_address: `0x${string}`;
}

const V2_DEPLOYED_BLOCK = 9380471;

export const event = univo.event({
	id: "ens_name_registered_v3",

	filters: [
		{
			chain: 1,
			fromBlock: V2_DEPLOYED_BLOCK,
		},
	],

	handler(block) {
		return block.eth_getBlockByNumber.transactions
			.map((tx) => {
				try {
					if (tx.to === null) {
						return null;
					}

					const registration = iife(() => {
						if (isHexEqual(tx.to!, V2_ADDRESS)) {
							if (tx.input.startsWith(toFunctionSelector(V2_REGISTER_ABI))) {
								const { args } = decodeFunctionData({ abi: [V2_REGISTER_ABI], data: tx.input });
								return { version: "v2" as const, eventAbi: v2, name: args[0], owner: getAddress(args[1]) };
							}

							if (tx.input.startsWith(toFunctionSelector(V2_REGISTER_WITH_CONFIG_ABI))) {
								const { args } = decodeFunctionData({ abi: [V2_REGISTER_WITH_CONFIG_ABI], data: tx.input });
								return { version: "v2" as const, eventAbi: v2, name: args[0], owner: getAddress(args[1]) };
							}
						}

						if (isHexEqual(tx.to!, V3_ADDRESS)) {
							if (tx.input.startsWith(toFunctionSelector(V3_REGISTER_ABI))) {
								const { args } = decodeFunctionData({ abi: [V3_REGISTER_ABI], data: tx.input });
								return { version: "v3" as const, eventAbi: v3, name: args[0], owner: getAddress(args[1]) };
							}
						}

						return null;
					});

					if (registration === null) {
						return null;
					}

					const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === tx.hash);
					const success = getEventSuccess(receipt);

					const { cost, expires } = iife(() => {
						if (success === false) {
							return { cost: 0, expires: 0n };
						}

						const log = receipt?.logs.find(
							(log) => isHexEqual(log.address, tx.to!) && log.topics[0] === toEventSelector(registration.eventAbi),
						);

						if (log === undefined) {
							throw new Error("Expected ENS registration log");
						}

						if (registration.version === "v2") {
							const { args } = decodeEventLog({ data: log.data, topics: log.topics, strict: true, abi: [v2] });
							return { cost: args.cost, expires: args.expires };
						}

						const { args } = decodeEventLog({ data: log.data, topics: log.topics, strict: true, abi: [v3] });
						return { cost: args.baseCost + args.premium, expires: args.expires };
					});

					const id = createId({
						logIndex: TRANSACTION_EVENT,
						chainId: block.eth_chainId,
						txIndex: tx.transactionIndex,
						tableId: TABLES.ens_name_registered_v3,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					return {
						id,
						success,
						name: registration.name,
						cost_eth: numberToHex(cost),
						expires_at: numberToHex(expires),
						owner_address: registration.owner,

						// Used for indexes
						receipt_to: getAddress(tx.to),
						log_address: getAddress(tx.to),
						receipt_from: getAddress(tx.from),
					};
				} catch {
					return null;
				}
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
							name: sql.raw(`excluded.${table.name.name}`),
							success: sql.raw(`excluded.${table.success.name}`),
							cost_eth: sql.raw(`excluded.${table.cost_eth.name}`),
							expires_at: sql.raw(`excluded.${table.expires_at.name}`),
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
	id: "ens_name_registered_v3_index_block_number_tx_index_v4",
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
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.ens_name_registered_v3);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<EnsNameRegisteredV3>((result) => {
		return {
			tag: "ens_name_registered_v3" as const,
			id: result.id,
			name: result.name,
			success: result.success,
			cost_eth: result.cost_eth,
			expires_at: result.expires_at,
			owner_address: getAddress(result.owner_address),
		};
	});
}

const V2_ADDRESS = getAddress("0x283af0b28c62c092c9727f1ee09c02ca627eb7f5");

const V2_REGISTER_ABI = parseAbiItem("function register(string name, address owner, uint256 duration, bytes32 secret)");

const V2_REGISTER_WITH_CONFIG_ABI = parseAbiItem(
	"function registerWithConfig(string name, address owner, uint256 duration, bytes32 secret, address resolver, address addr)",
);

const V3_ADDRESS = getAddress("0x253553366da8546fc250f225fe3d25d0c782303b");

const V3_REGISTER_ABI = parseAbiItem(
	"function register(string name, address owner, uint256 duration, bytes32 secret, address resolver, bytes[] data, bool reverseRecord, uint16 ownerControlledFuses)",
);

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
