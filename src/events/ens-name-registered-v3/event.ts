import { asc, inArray, sql } from "drizzle-orm";
import {
	decodeEventLog,
	decodeFunctionData,
	getAddress,
	isAddressEqual,
	parseAbiItem,
	toEventSelector,
	toFunctionSelector,
} from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { nonNullable, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_account_v3 } from "@/indexes/account-v3";
import { getEventSuccess, createId, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface EnsNameRegisteredV3 {
	tag: "ens_name_registered_v3";
	id: string;
	success: boolean;
	name: string;
	cost_eth: `0x${string}`;
	owner_address: `0x${string}`;
	expires_at: `0x${string}`;
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

					const to = tx.to;
					const registration = getEnsRegistration(to, tx.input);

					if (registration === null) {
						return null;
					}

					const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === tx.hash);
					const success = getEventSuccess(receipt);
					let cost = 0n;
					let expires = 0n;

					if (success) {
						const log = receipt?.logs.find(
							(log) => isAddressEqual(log.address, to) && log.topics[0] === toEventSelector(registration.eventAbi),
						);

						if (log === undefined) {
							throw new Error("Expected ENS registration log");
						}

						if (registration.version === "v2") {
							const { args } = decodeEventLog({ data: log.data, topics: log.topics, strict: true, abi: [v2] });
							cost = args.cost;
							expires = args.expires;
						} else {
							const { args } = decodeEventLog({ data: log.data, topics: log.topics, strict: true, abi: [v3] });
							cost = args.baseCost + args.premium;
							expires = args.expires;
						}
					}

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
						owner_address: registration.owner,
						cost_eth: numberToHex(cost),
						expires_at: numberToHex(expires),

						// Used for indexes
						receipt_to: getAddress(to),
						log_address: getAddress(to),
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
							success: sql.raw(`excluded.${table.success.name}`),
							name: sql.raw(`excluded.${table.name.name}`),
							cost_eth: sql.raw(`excluded.${table.cost_eth.name}`),
							owner_address: sql.raw(`excluded.${table.owner_address.name}`),
							expires_at: sql.raw(`excluded.${table.expires_at.name}`),
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

const V2_ADDRESS = getAddress("0x283af0b28c62c092c9727f1ee09c02ca627eb7f5");
const V2_REGISTER_ABI = parseAbiItem("function register(string name, address owner, uint256 duration, bytes32 secret)");
const V2_REGISTER_WITH_CONFIG_ABI = parseAbiItem(
	"function registerWithConfig(string name, address owner, uint256 duration, bytes32 secret, address resolver, address addr)",
);
const V2_REGISTER_WITH_CONFIG_SELECTOR = toFunctionSelector(V2_REGISTER_WITH_CONFIG_ABI);
const V2_REGISTER_SELECTOR = toFunctionSelector(V2_REGISTER_ABI);

const V3_ADDRESS = getAddress("0x253553366da8546fc250f225fe3d25d0c782303b");
const V3_REGISTER_ABI = parseAbiItem(
	"function register(string name, address owner, uint256 duration, bytes32 secret, address resolver, bytes[] data, bool reverseRecord, uint16 ownerControlledFuses)",
);
const V3_REGISTER_SELECTOR = toFunctionSelector(V3_REGISTER_ABI);

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

function getEnsRegistration(to: `0x${string}`, input: `0x${string}`) {
	if (isAddressEqual(to, V2_ADDRESS)) {
		if (input.startsWith(V2_REGISTER_SELECTOR)) {
			const { args } = decodeFunctionData({ abi: [V2_REGISTER_ABI], data: input });
			return { version: "v2" as const, eventAbi: v2, name: args[0], owner: getAddress(args[1]) };
		}

		if (input.startsWith(V2_REGISTER_WITH_CONFIG_SELECTOR)) {
			const { args } = decodeFunctionData({ abi: [V2_REGISTER_WITH_CONFIG_ABI], data: input });
			return { version: "v2" as const, eventAbi: v2, name: args[0], owner: getAddress(args[1]) };
		}
	}

	if (isAddressEqual(to, V3_ADDRESS) && input.startsWith(V3_REGISTER_SELECTOR)) {
		const { args } = decodeFunctionData({ abi: [V3_REGISTER_ABI], data: input });
		return { version: "v3" as const, eventAbi: v3, name: args[0], owner: getAddress(args[1]) };
	}

	return null;
}

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
			success: result.success,
			name: result.name,
			cost_eth: result.cost_eth,
			owner_address: getAddress(result.owner_address),
			expires_at: result.expires_at,
		};
	});
}
