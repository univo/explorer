import { asc, inArray, sql } from "drizzle-orm";
import { decodeEventLog, getAddress, parseAbiItem, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { isHexEqual } from "@/utils";
import { createId, parseId } from "@/helpers";
import { TABLES, type Chain } from "@/constants";
import { createPostgresClient } from "@/db/client";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface LogEnsNameForAddrChangedV1 {
	tag: "log_ens_name_for_addr_changed_v1";
	id: string;
	success: true;
	name: string;
	account_address: `0x${string}`;
}

export const ENS_DEFAULT_REVERSE_REGISTRAR_ADDRESS = getAddress("0x283F227c4Bd38ecE252C4Ae7ECE650B0e913f1f9");
export const ENS_DEFAULT_REVERSE_REGISTRAR_DEPLOYED_BLOCK = 22764819;

const NAME_FOR_ADDR_CHANGED_ABI = parseAbiItem("event NameForAddrChanged(address indexed addr, string name)");

export const event = univo.event({
	id: "log_ens_name_for_addr_changed_v1",

	filters: [
		{
			chain: 1,
			address: ENS_DEFAULT_REVERSE_REGISTRAR_ADDRESS,
			event: toEventSelector(NAME_FOR_ADDR_CHANGED_ABI),
			fromBlock: ENS_DEFAULT_REVERSE_REGISTRAR_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockReceipts.flatMap((receipt) => {
			return receipt.logs.flatMap((log) => {
				try {
					if (!isHexEqual(log.address, ENS_DEFAULT_REVERSE_REGISTRAR_ADDRESS)) {
						return [];
					}

					if (!isHexEqual(log.topics[0], toEventSelector(NAME_FOR_ADDR_CHANGED_ABI))) {
						return [];
					}

					const { args } = decodeEventLog({
						abi: [NAME_FOR_ADDR_CHANGED_ABI],
						data: log.data,
						topics: log.topics,
						strict: true,
					});

					const id = createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: TABLES.log_ens_name_for_addr_changed_v1,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					return {
						id,
						name: args.name,
						account_address: getAddress(args.addr),
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
							name: sql.raw(`excluded.${table.name.name}`),
							account_address: sql.raw(`excluded.${table.account_address.name}`),
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
	id: "log_ens_name_for_addr_changed_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

export async function getLogEnsNameForAddrChangedV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.log_ens_name_for_addr_changed_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<LogEnsNameForAddrChangedV1>((row) => ({
		tag: "log_ens_name_for_addr_changed_v1",
		id: row.id,
		name: row.name,
		success: true,
		account_address: getAddress(row.account_address),
	}));
}

// This event is also useful as eligibility check to quickly know if an account _might_ have specified
// an ENS name. This is used to prevent issuing RPC calls for ENS names for accounts the definitely will
// not have one specified.

export async function getEnsExistsForAccounts(accounts: { chain: Chain; address: `0x${string}` }[]) {
	if (accounts.length === 0) {
		return [];
	}

	const addresses = [...new Set(accounts.map((account) => getAddress(account.address)))];

	const client = await createPostgresClient();

	const rows = await client
		.selectDistinct({ address: table.account_address }) //
		.from(table)
		.where(inArray(table.account_address, addresses));

	return accounts.map((account) => rows.some((row) => isHexEqual(row.address, account.address)));
}
