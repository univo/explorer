import { asc, inArray, sql } from "drizzle-orm";
import { boolean, pgTable } from "drizzle-orm/pg-core";
import { decodeEventLog, getAddress, parseAbiItem, toEventSelector } from "viem";

import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { hex, id } from "@/db/types";
import { createPostgresClient } from "@/db/client";
import { nonNullable, numberToHex } from "@/utils";
import { index_account_v3 } from "@/indexes/account-v3";
import { getEventSuccess, getTxReceiptForLog, createId, parseId } from "@/helpers";
import { index_block_number_tx_index_v3 } from "@/indexes/block-number-tx-index-v3";

export interface Erc20ApprovalV3 {
	tag: "erc20_approval_v3";
	id: string;
	success: boolean;
	quantity: `0x${string}`;
	owner_address: `0x${string}`;
	spender_address: `0x${string}`;
	token_address: `0x${string}`;
}

export const table = pgTable("event_erc20_approval_v3", {
	id: id().primaryKey(),
	quantity: hex().notNull(),
	success: boolean().notNull(),
	owner_address: hex().notNull(),
	spender_address: hex().notNull(),
	token_address: hex().notNull(),
});

const abi = parseAbiItem("event Approval(address indexed owner, address indexed spender, uint256 value)");

export const event = univo.event({
	id: "erc20_approval_v3",

	filters: [{ chain: 1, fromBlock: 0, event: toEventSelector(abi) }],

	handler: (block) => {
		return block.eth_getBlockReceipts
			.flatMap((receipt) => receipt.logs)
			.filter((log) => log.topics[0] === toEventSelector(abi))
			.map((log) => {
				try {
					const { args } = decodeEventLog({ topics: log.topics, data: log.data, strict: true, abi: [abi] });

					const id = createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: tables.erc20_approval_v2,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					const receipt = getTxReceiptForLog(block.eth_getBlockReceipts, log);

					return {
						id,
						success: getEventSuccess(receipt),
						quantity: numberToHex(args.value),
						owner_address: getAddress(args.owner),
						spender_address: getAddress(args.spender),
						token_address: getAddress(log.address),
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
							quantity: sql.raw(`excluded.${table.quantity.name}`),
							owner_address: sql.raw(`excluded.${table.owner_address.name}`),
							spender_address: sql.raw(`excluded.${table.spender_address.name}`),
							token_address: sql.raw(`excluded.${table.token_address.name}`),
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
	storage: index_block_number_tx_index_v3,
	id: "erc20_approval_v3_index_block_number_tx_index_v3",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "erc20_approval_v3_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.token_address }, //
				{ event_id: event.id, account: event.spender_address },
				{ event_id: event.id, account: event.owner_address },
			];
		});
	},
});

export async function getErc20ApprovalV3(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === tables.erc20_approval_v2);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client.select().from(table).where(inArray(table.id, filtered)).orderBy(asc(table.id));

	return rows.map<Erc20ApprovalV3>((result) => {
		return {
			tag: "erc20_approval_v3" as const,
			id: result.id,
			success: result.success,
			quantity: result.quantity,
			owner_address: getAddress(result.owner_address),
			spender_address: getAddress(result.spender_address),
			token_address: getAddress(result.token_address),
		};
	});
}
