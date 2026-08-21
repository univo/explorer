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

export interface IntentFwaDepositedV1 {
	tag: "intent_fwa_deposited_v1";
	id: string;
	success: boolean;
	token_id: `0x${string}`;
	backing_eth: `0x${string}`;
	depositor_address: `0x${string}`;
	collection_address: `0x${string}`;
}

export const FWA_DEPLOYED_BLOCK = 25546793;
export const FWA_ADDRESS = getAddress("0xB276F62DB0ce8CA2Ca5bc522695bE604521eAc1c");

const LIST_NFT_ABI = parseAbiItem("function listNFT(address collection, uint256 tokenId)");

export const event = univo.event({
	id: "intent_fwa_deposited_v1",

	filters: [
		{
			chain: 1,
			address: FWA_ADDRESS,
			fromBlock: FWA_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
			try {
				// When deploying a contract the `to` field is null
				if (tx.to === null) {
					return [];
				}

				if (!isHexEqual(tx.to, FWA_ADDRESS) || !tx.input.startsWith(toFunctionSelector(LIST_NFT_ABI))) {
					return [];
				}

				const { args } = decodeFunctionData({ abi: [LIST_NFT_ABI], data: tx.input });

				const id = createId({
					logIndex: TRANSACTION_EVENT,
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_fwa_deposited_v1,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionHash, tx.hash));

				return {
					id,
					backing_eth: tx.value,
					token_id: numberToHex(args[1]),
					success: getEventSuccess(receipt),
					depositor_address: getAddress(tx.from),
					collection_address: getAddress(args[0]),
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
							backing_eth: sql.raw(`excluded.${table.backing_eth.name}`),
							depositor_address: sql.raw(`excluded.${table.depositor_address.name}`),
							collection_address: sql.raw(`excluded.${table.collection_address.name}`),
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
	id: "intent_fwa_deposited_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_fwa_deposited_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: FWA_ADDRESS },
				{ event_id: event.id, account: event.depositor_address },
				{ event_id: event.id, account: event.collection_address },
			];
		});
	},
});

export async function getIntentFwaDepositedV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_fwa_deposited_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentFwaDepositedV1>((result) => {
		return {
			tag: "intent_fwa_deposited_v1" as const,
			id: result.id,
			success: result.success,
			token_id: result.token_id,
			backing_eth: result.backing_eth,
			depositor_address: getAddress(result.depositor_address),
			collection_address: getAddress(result.collection_address),
		};
	});
}
