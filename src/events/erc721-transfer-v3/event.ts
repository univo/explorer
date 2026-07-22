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

export interface Erc721TransferV3 {
	tag: "erc721_transfer_v3";
	id: string;
	success: boolean;
	token_id: `0x${string}`;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
	token_address: `0x${string}`;
}

export const table = pgTable("event_erc721_transfer_v3", {
	id: id().primaryKey(),
	token_id: hex().notNull(),
	to_address: hex().notNull(),
	success: boolean().notNull(),
	from_address: hex().notNull(),
	token_address: hex().notNull(),
});

const abi = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)");

export const event = univo.event({
	id: "erc721_transfer_v3",

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
						tableId: tables.erc721_transfer_v2,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					const receipt = getTxReceiptForLog(block.eth_getBlockReceipts, log);

					return {
						id,
						success: getEventSuccess(receipt),
						token_id: numberToHex(args.tokenId),
						to_address: getAddress(args.to),
						from_address: getAddress(args.from),
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
							token_id: sql.raw(`excluded.${table.token_id.name}`),
							to_address: sql.raw(`excluded.${table.to_address.name}`),
							from_address: sql.raw(`excluded.${table.from_address.name}`),
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
	id: "erc721_transfer_v3_index_block_number_tx_index_v3",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "erc721_transfer_v3_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.to_address }, //
				{ event_id: event.id, account: event.from_address },
				{ event_id: event.id, account: event.token_address },
			];
		});
	},
});

export async function getErc721TransferV3(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === tables.erc721_transfer_v2);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client.select().from(table).where(inArray(table.id, filtered)).orderBy(asc(table.id));

	return rows.map<Erc721TransferV3>((result) => {
		return {
			tag: "erc721_transfer_v3" as const,
			id: result.id,
			success: result.success,
			token_id: result.token_id,
			to_address: getAddress(result.to_address),
			from_address: getAddress(result.from_address),
			token_address: getAddress(result.token_address),
		};
	});
}
