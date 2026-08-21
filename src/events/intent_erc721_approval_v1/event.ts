import { asc, inArray, sql } from "drizzle-orm";
import { decodeFunctionData, getAddress, isAddressEqual, parseAbi, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { createPostgresClient } from "@/db/client";
import { iife, isHexEqual, numberToHex } from "@/utils";
import { index_account_v3 } from "@/indexes/account-v3";
import { createId, getEventSuccess, parseId } from "@/helpers";
import { TABLES, TRANSACTION_EVENT, ZERO_ADDRESS } from "@/constants";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface IntentErc721ApprovalV1 {
	tag: "intent_erc721_approval_v1";
	id: string;
	approved: boolean;
	success: boolean;
	token_id: `0x${string}` | null;
	caller_address: `0x${string}`;
	token_address: `0x${string}`;
	spender_address: `0x${string}`;
}

const APPROVAL_ABI = parseAbi([
	"function approve(address spender, uint256 tokenId)",
	"function setApprovalForAll(address operator, bool approved)",
]);
const APPROVAL_SELECTORS = new Set(APPROVAL_ABI.map((item) => toFunctionSelector(item)));

export const event = univo.event({
	id: "intent_erc721_approval_v1",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
			try {
				// When deploying a contract the `to` field is null
				if (tx.to === null) {
					return [];
				}

				if (!APPROVAL_SELECTORS.has(tx.input.slice(0, 10) as `0x${string}`)) {
					return [];
				}

				const decoded = decodeFunctionData({ abi: APPROVAL_ABI, data: tx.input });
				const spender_address = getAddress(decoded.args[0]);

				const approval = iife(() => {
					if (decoded.functionName === "approve") {
						return {
							approved: !isAddressEqual(spender_address, ZERO_ADDRESS),
							token_id: numberToHex(decoded.args[1]),
						};
					}

					return {
						approved: decoded.args[1],
						token_id: null,
					};
				});

				const id = createId({
					logIndex: TRANSACTION_EVENT,
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_erc721_approval_v1,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionHash, tx.hash));

				return {
					id,
					...approval,
					spender_address,
					success: getEventSuccess(receipt),
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
							approved: sql.raw(`excluded.${table.approved.name}`),
							success: sql.raw(`excluded.${table.success.name}`),
							token_id: sql.raw(`excluded.${table.token_id.name}`),
							caller_address: sql.raw(`excluded.${table.caller_address.name}`),
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
	id: "intent_erc721_approval_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_erc721_approval_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.caller_address },
				{ event_id: event.id, account: event.spender_address },
				{ event_id: event.id, account: event.token_address },
			];
		});
	},
});

export async function getIntentErc721ApprovalV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_erc721_approval_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentErc721ApprovalV1>((result) => {
		return {
			tag: "intent_erc721_approval_v1" as const,
			id: result.id,
			approved: result.approved,
			success: result.success,
			token_id: result.token_id,
			caller_address: getAddress(result.caller_address),
			token_address: getAddress(result.token_address),
			spender_address: getAddress(result.spender_address),
		};
	});
}
