import { and, asc, inArray } from "drizzle-orm";
import { decodeEventLog, getAddress, hexToNumber, keccak256, parseAbiItem, stringToHex, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { inTuple } from "@/db/types";
import { isHexEqual } from "@/utils";
import type { Id } from "@/events";
import { TABLES, type Chain } from "@/constants";
import { createPostgresClient } from "@/db/client";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface LogEnsNewOwnerV2 {
	tag: "log_ens_new_owner_v2";
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
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
	id: "log_ens_new_owner_v2",

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
			return receipt.logs.flatMap<LogEnsNewOwnerV2>((log) => {
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

					return {
						tag: "log_ens_new_owner_v2",
						log_index: hexToNumber(log.logIndex),
						chain: hexToNumber(block.eth_chainId),
						tx_index: hexToNumber(log.transactionIndex),
						block_number: hexToNumber(block.eth_getBlockByNumber.number),
						block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
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
	id: "log_ens_new_owner_v2_index_block_number_tx_index_v4",
});

export async function getLogEnsNewOwnerV2(ids: Id[]) {
	const filtered = ids.filter((id) => TABLES[id.tag] === TABLES.log_ens_new_owner_v2);

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

	return rows.map<LogEnsNewOwnerV2>((row) => {
		return {
			tag: "log_ens_new_owner_v2",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			label: row.label,
			owner_address: getAddress(row.owner_address),
		};
	});
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
