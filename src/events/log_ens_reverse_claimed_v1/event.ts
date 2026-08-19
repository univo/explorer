import { asc, inArray, sql } from "drizzle-orm";
import { decodeEventLog, getAddress, parseAbiItem, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { isHexEqual } from "@/utils";
import { createId, parseId } from "@/helpers";
import { TABLES, type Chain } from "@/constants";
import { createPostgresClient } from "@/db/client";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface LogEnsReverseClaimedV1 {
	tag: "log_ens_reverse_claimed_v1";
	id: string;
	success: true;
	node: `0x${string}`;
	account_address: `0x${string}`;
}

export const ENS_REVERSE_REGISTRAR_V2_ADDRESS = getAddress("0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb");
export const ENS_REVERSE_REGISTRAR_V2_DEPLOYED_BLOCK = 16925606;

const REVERSE_CLAIMED_ABI = parseAbiItem("event ReverseClaimed(address indexed addr, bytes32 indexed node)");

export const event = univo.event({
	id: "log_ens_reverse_claimed_v1",

	filters: [
		{
			chain: 1,
			address: ENS_REVERSE_REGISTRAR_V2_ADDRESS,
			event: toEventSelector(REVERSE_CLAIMED_ABI),
			fromBlock: ENS_REVERSE_REGISTRAR_V2_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockReceipts.flatMap((receipt) => {
			return receipt.logs.flatMap((log) => {
				try {
					if (!isHexEqual(log.address, ENS_REVERSE_REGISTRAR_V2_ADDRESS)) {
						return [];
					}

					if (!isHexEqual(log.topics[0], toEventSelector(REVERSE_CLAIMED_ABI))) {
						return [];
					}

					const { args } = decodeEventLog({
						strict: true,
						data: log.data,
						topics: log.topics,
						abi: [REVERSE_CLAIMED_ABI],
					});

					const id = createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: TABLES.log_ens_reverse_claimed_v1,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					return {
						id,
						node: args.node,
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
							node: sql.raw(`excluded.${table.node.name}`),
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
	id: "log_ens_reverse_claimed_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

export async function getLogEnsReverseClaimedV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.log_ens_reverse_claimed_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<LogEnsReverseClaimedV1>((row) => ({
		tag: "log_ens_reverse_claimed_v1",
		id: row.id,
		success: true,
		node: row.node,
		account_address: getAddress(row.account_address),
	}));
}

// This event is also useful as eligibility check to quickly know if an account _might_ have specified
// an ENS name. This is used to prevent issuing RPC calls for ENS names for accounts the definitely will
// not have one specified.

export async function getLegacyEnsExistsForAccounts(accounts: { chain: Chain; address: `0x${string}` }[]) {
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
