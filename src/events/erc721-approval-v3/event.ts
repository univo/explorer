import { asc, inArray, sql } from "drizzle-orm";
import { decodeEventLog, getAddress, parseAbiItem, toEventSelector } from "viem";

import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { schema } from "@/db/schema";
import { createPostgresClient } from "@/db/client";
import { nonNullable, numberToHex } from "@/utils";
import { index_account_v3 } from "@/indexes/account-v3";
import { getEventSuccess, getTxReceiptForLog, createId, parseId } from "@/helpers";
import { index_block_number_tx_index_v3 } from "@/indexes/block-number-tx-index-v3";

export interface Erc721ApprovalV3 {
	tag: "erc721_approval_v3";
	id: string;
	success: boolean;
	token_id: `0x${string}`;
	owner_address: `0x${string}`;
	spender_address: `0x${string}`;
	token_address: `0x${string}`;
}

const abi = parseAbiItem("event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)");

export const event = univo.event({
	id: "erc721_approval_v3",

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
						tableId: tables.erc721_approval_v2,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					const receipt = getTxReceiptForLog(block.eth_getBlockReceipts, log);

					return {
						id,
						success: getEventSuccess(receipt),
						token_id: numberToHex(args.tokenId),
						owner_address: getAddress(args.owner),
						spender_address: getAddress(args.approved),
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
					.insert(schema.event_erc721_approval_v3)
					.values(batch.slice(i, i + MAX_BATCH_SIZE))
					.onConflictDoUpdate({
						target: schema.event_erc721_approval_v3.id,
						set: {
							success: sql.raw(`excluded.${schema.event_erc721_approval_v3.success.name}`),
							token_id: sql.raw(`excluded.${schema.event_erc721_approval_v3.token_id.name}`),
							owner_address: sql.raw(`excluded.${schema.event_erc721_approval_v3.owner_address.name}`),
							spender_address: sql.raw(`excluded.${schema.event_erc721_approval_v3.spender_address.name}`),
							token_address: sql.raw(`excluded.${schema.event_erc721_approval_v3.token_address.name}`),
						},
					});
			}
		},

		async delete(batch) {
			const client = await createPostgresClient();

			await client.delete(schema.event_erc721_approval_v3).where(
				inArray(
					schema.event_erc721_approval_v3.id,
					batch.map((event) => event.id),
				),
			);
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_tx_index_v3,
	id: "erc721_approval_v3_index_block_number_tx_index_v3",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "erc721_approval_v3_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.owner_address }, //
				{ event_id: event.id, account: event.token_address },
				{ event_id: event.id, account: event.spender_address },
			];
		});
	},
});

export async function getErc721ApprovalV3(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === tables.erc721_approval_v2);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const results = await client
		.select()
		.from(schema.event_erc721_approval_v3)
		.where(inArray(schema.event_erc721_approval_v3.id, filtered))
		.orderBy(asc(schema.event_erc721_approval_v3.id));

	return results.map<Erc721ApprovalV3>((result) => {
		return {
			tag: "erc721_approval_v3" as const,
			id: result.id,
			success: result.success,
			token_id: result.token_id,
			owner_address: getAddress(result.owner_address),
			spender_address: getAddress(result.spender_address),
			token_address: getAddress(result.token_address),
		};
	});
}
