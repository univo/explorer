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

export interface IntentErc20ApprovalV1 {
	tag: "intent_erc20_approval_v1";
	id: string;
	success: boolean;
	quantity: `0x${string}`;
	owner_address: `0x${string}`;
	token_address: `0x${string}`;
	spender_address: `0x${string}`;
}

const APPROVE_ABI = parseAbiItem("function approve(address spender, uint256 value)");
const APPROVE_SELECTOR = toFunctionSelector(APPROVE_ABI);

export const event = univo.event({
	id: "intent_erc20_approval_v1",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
			try {
				if (tx.to === null || !tx.input.startsWith(APPROVE_SELECTOR)) {
					return [];
				}

				const { args } = decodeFunctionData({ abi: [APPROVE_ABI], data: tx.input });

				const id = createId({
					logIndex: TRANSACTION_EVENT,
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_erc20_approval_v1,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionHash, tx.hash));

				return {
					id,
					spender_address: getAddress(args[0]),
					quantity: numberToHex(args[1]),
					success: getEventSuccess(receipt),
					owner_address: getAddress(tx.from),
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
	storage: index_block_number_tx_index_v4,
	id: "intent_erc20_approval_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_erc20_approval_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.owner_address },
				{ event_id: event.id, account: event.spender_address },
				{ event_id: event.id, account: event.token_address },
			];
		});
	},
});

export async function getIntentErc20ApprovalV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_erc20_approval_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentErc20ApprovalV1>((result) => {
		return {
			tag: "intent_erc20_approval_v1" as const,
			id: result.id,
			success: result.success,
			quantity: result.quantity,
			owner_address: getAddress(result.owner_address),
			token_address: getAddress(result.token_address),
			spender_address: getAddress(result.spender_address),
		};
	});
}
