import { asc, inArray, sql } from "drizzle-orm";
import { decodeFunctionData, getAddress, parseAbi, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v3 } from "@/indexes/account-v3";
import { createId, getEventSuccess, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface IntentErc721TransferV1 {
	tag: "intent_erc721_transfer_v1";
	id: string;
	success: boolean;
	token_id: `0x${string}`;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
	caller_address: `0x${string}`;
	token_address: `0x${string}`;
}

const TRANSFER_ABI = parseAbi([
	"function transferFrom(address from, address to, uint256 tokenId)",
	"function safeTransferFrom(address from, address to, uint256 tokenId)",
	"function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
]);
const TRANSFER_SELECTORS = new Set(TRANSFER_ABI.map((item) => toFunctionSelector(item)));

export const event = univo.event({
	id: "intent_erc721_transfer_v1",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
			try {
				// When deploying a contract the `to` field is null
				if (tx.to === null) {
					return [];
				}

				if (!TRANSFER_SELECTORS.has(tx.input.slice(0, 10) as `0x${string}`)) {
					return [];
				}

				const { args } = decodeFunctionData({ abi: TRANSFER_ABI, data: tx.input });

				const id = createId({
					logIndex: TRANSACTION_EVENT,
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_erc721_transfer_v1,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionHash, tx.hash));

				return {
					id,
					to_address: getAddress(args[1]),
					token_id: numberToHex(args[2]),
					success: getEventSuccess(receipt),
					from_address: getAddress(args[0]),
					caller_address: getAddress(tx.from),
					token_address: getAddress(tx.to),
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
							success: sql.raw(`excluded.${table.success.name}`),
							token_id: sql.raw(`excluded.${table.token_id.name}`),
							to_address: sql.raw(`excluded.${table.to_address.name}`),
							from_address: sql.raw(`excluded.${table.from_address.name}`),
							caller_address: sql.raw(`excluded.${table.caller_address.name}`),
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
	storage: index_block_number_tx_index_v4,
	id: "intent_erc721_transfer_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_erc721_transfer_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.to_address },
				{ event_id: event.id, account: event.from_address },
				{ event_id: event.id, account: event.caller_address },
				{ event_id: event.id, account: event.token_address },
			];
		});
	},
});

export async function getIntentErc721TransferV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_erc721_transfer_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentErc721TransferV1>((result) => {
		return {
			tag: "intent_erc721_transfer_v1" as const,
			id: result.id,
			success: result.success,
			token_id: result.token_id,
			to_address: getAddress(result.to_address),
			from_address: getAddress(result.from_address),
			caller_address: getAddress(result.caller_address),
			token_address: getAddress(result.token_address),
		};
	});
}
