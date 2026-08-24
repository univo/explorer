import { asc, inArray, sql } from "drizzle-orm";
import { decodeEventLog, decodeFunctionData, getAddress, parseAbiItem, toEventSelector, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { createPostgresClient } from "@/db/client";
import { isHexEqual, numberToHex } from "@/utils";
import { index_account_v3 } from "@/indexes/account-v3";
import { createId, getEventSuccess, parseId } from "@/helpers";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface IntentErc721ApprovalV1 {
	tag: "intent_erc721_approval_v1";
	id: string;
	success: boolean;
	token_id: `0x${string}`;
	caller_address: `0x${string}`;
	token_address: `0x${string}`;
	spender_address: `0x${string}`;
}

const APPROVE_ABI = parseAbiItem("function approve(address spender, uint256 tokenId)");
const APPROVE_SELECTOR = toFunctionSelector(APPROVE_ABI);
const APPROVAL_ABI = parseAbiItem("event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)");
const APPROVAL_SELECTOR = toEventSelector(APPROVAL_ABI);

export const event = univo.event({
	id: "intent_erc721_approval_v1",

	filters: [
		{
			chain: 1,
			fromBlock: 0,
			event: APPROVAL_SELECTOR,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
			try {
				// When deploying a contract the `to` field is null
				if (tx.to === null) {
					return [];
				}

				if (!tx.input.startsWith(APPROVE_SELECTOR)) {
					return [];
				}

				// This intent is slightly different to others because of one edge case: the approval
				// function selector is identical on erc20 and erc721 interfaces. Thankfully, they
				// emit different log signatures for a successful approval so we can inspect those
				// to differentiate

				// The caveat here is that we will not record an intent if the transaction fails before
				// emitting the necessary logs. This is rare so i'm fine with this.

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionIndex, tx.transactionIndex));

				if (receipt === undefined) {
					return [];
				}

				const { args } = decodeFunctionData({ abi: [APPROVE_ABI], data: tx.input });

				const approval = receipt.logs.find((log) => {
					try {
						if (tx.to === null || log.address === null || log.topics[0] === null) {
							return false;
						}

						if (!isHexEqual(log.address, tx.to) || !isHexEqual(log.topics[0], APPROVAL_SELECTOR)) {
							return false;
						}

						const decoded = decodeEventLog({
							strict: true,
							data: log.data,
							topics: log.topics,
							abi: [APPROVAL_ABI],
						});

						const tokenIdEqual = decoded.args.tokenId === args[1];
						const spenderEqual = isHexEqual(decoded.args.approved, args[0]);

						return spenderEqual && tokenIdEqual;
					} catch {
						return false;
					}
				});

				if (approval === undefined) {
					return [];
				}

				const id = createId({
					logIndex: TRANSACTION_EVENT,
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_erc721_approval_v1,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				return {
					id,
					success: getEventSuccess(receipt),
					token_id: numberToHex(args[1]),
					token_address: getAddress(tx.to),
					caller_address: getAddress(tx.from),
					spender_address: getAddress(args[0]),
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
							token_address: sql.raw(`excluded.${table.token_address.name}`),
							caller_address: sql.raw(`excluded.${table.caller_address.name}`),
							spender_address: sql.raw(`excluded.${table.spender_address.name}`),
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
				{ event_id: event.id, account: event.token_address },
				{ event_id: event.id, account: event.caller_address },
				{ event_id: event.id, account: event.spender_address },
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
			success: result.success,
			token_id: result.token_id,
			token_address: getAddress(result.token_address),
			caller_address: getAddress(result.caller_address),
			spender_address: getAddress(result.spender_address),
		};
	});
}
