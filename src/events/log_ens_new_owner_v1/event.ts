import { asc, inArray, sql } from "drizzle-orm";
import { decodeEventLog, getAddress, keccak256, parseAbiItem, stringToHex, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { isHexEqual } from "@/utils";
import { createId, parseId } from "@/helpers";
import { TABLES, type Chain } from "@/constants";
import { createPostgresClient } from "@/db/client";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface LogEnsNewOwnerV1 {
	tag: "log_ens_new_owner_v1";
	id: string;
	success: true;
	label: `0x${string}`;
	owner_address: `0x${string}`;
}

export const ENS_REGISTRY_V1_ADDRESS = getAddress("0x314159265dD8dbb310642f98f50C066173C1259b");
export const ENS_REGISTRY_V1_DEPLOYED_BLOCK = 3327417;
export const ENS_REGISTRY_V2_ADDRESS = getAddress("0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e");
export const ENS_REGISTRY_V2_DEPLOYED_BLOCK = 9380380;

export const ENS_ADDR_REVERSE_NODE = "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2";

const NEW_OWNER_ABI = parseAbiItem("event NewOwner(bytes32 indexed node, bytes32 indexed label, address owner)");
const ENS_REGISTRIES = [ENS_REGISTRY_V1_ADDRESS, ENS_REGISTRY_V2_ADDRESS];

export const event = univo.event({
	id: "log_ens_new_owner_v1",

	filters: [
		{
			chain: 1,
			address: ENS_REGISTRY_V1_ADDRESS,
			event: toEventSelector(NEW_OWNER_ABI),
			fromBlock: ENS_REGISTRY_V1_DEPLOYED_BLOCK,
		},
		{
			chain: 1,
			address: ENS_REGISTRY_V2_ADDRESS,
			event: toEventSelector(NEW_OWNER_ABI),
			fromBlock: ENS_REGISTRY_V2_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockReceipts.flatMap((receipt) => {
			return receipt.logs.flatMap((log) => {
				try {
					if (!ENS_REGISTRIES.some((address) => isHexEqual(log.address, address))) {
						return [];
					}

					if (!isHexEqual(log.topics[0], toEventSelector(NEW_OWNER_ABI))) {
						return [];
					}

					const { args } = decodeEventLog({
						strict: true,
						data: log.data,
						topics: log.topics,
						abi: [NEW_OWNER_ABI],
					});

					if (!isHexEqual(args.node, ENS_ADDR_REVERSE_NODE)) {
						return [];
					}

					const id = createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: TABLES.log_ens_new_owner_v1,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					return {
						id,
						label: args.label,
						owner_address: getAddress(args.owner),
					};
				} catch {
					return [];
				}
			});
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
							label: sql.raw(`excluded.${table.label.name}`),
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
	id: "log_ens_new_owner_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

export async function getLogEnsNewOwnerV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.log_ens_new_owner_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<LogEnsNewOwnerV1>((row) => ({
		tag: "log_ens_new_owner_v1",
		id: row.id,
		success: true,
		label: row.label,
		owner_address: getAddress(row.owner_address),
	}));
}

// Reverse registrars hash the lowercase hexadecimal address text into the NewOwner label.

function getReverseLabel(address: `0x${string}`) {
	return keccak256(stringToHex(getAddress(address).slice(2).toLowerCase()));
}

export async function getEnsExistsForAccounts(accounts: { chain: Chain; address: `0x${string}` }[]) {
	if (accounts.length === 0) {
		return [];
	}

	const addresses = [...new Set(accounts.map((account) => getAddress(account.address)))];

	const labels = addresses.map(getReverseLabel);

	const client = await createPostgresClient();

	const rows = await client
		.selectDistinct({ label: table.label }) //
		.from(table)
		.where(inArray(table.label, labels));

	return accounts.map((account) => {
		const label = getReverseLabel(account.address);
		return rows.some((row) => isHexEqual(row.label, label));
	});
}
