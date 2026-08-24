import { asc, inArray, sql } from "drizzle-orm";
import { decodeFunctionData, getAddress, isAddressEqual, parseAbiItem, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { isHexEqual } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v3 } from "@/indexes/account-v3";
import { createId, getEventSuccess, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface IntentUsdcBlacklistV1 {
	tag: "intent_usdc_blacklist_v1";
	id: string;
	success: boolean;
	account_address: `0x${string}`;
}

const USDC_DEPLOYED_BLOCK = 6082465;
const USDC_ADDRESS = getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");

const BLACKLIST_ABI = parseAbiItem("function blacklist(address _account)");
const BLACKLIST_SELECTOR = toFunctionSelector(BLACKLIST_ABI);

export const event = univo.event({
	id: "intent_usdc_blacklist_v1",

	filters: [
		{
			chain: 1,
			address: USDC_ADDRESS,
			fromBlock: USDC_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
			try {
				// When deploying a contract the `to` field is null
				if (tx.to === null) {
					return [];
				}

				if (!isAddressEqual(tx.to, USDC_ADDRESS) || !tx.input.startsWith(BLACKLIST_SELECTOR)) {
					return [];
				}

				const { args } = decodeFunctionData({ abi: [BLACKLIST_ABI], data: tx.input });

				const id = createId({
					logIndex: TRANSACTION_EVENT,
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_usdc_blacklist_v1,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionHash, tx.hash));

				return {
					id,
					success: getEventSuccess(receipt),
					account_address: getAddress(args[0]),
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
	id: "intent_usdc_blacklist_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_usdc_blacklist_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: USDC_ADDRESS },
				{ event_id: event.id, account: event.account_address },
			];
		});
	},
});

export async function getIntentUsdcBlacklistV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_usdc_blacklist_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentUsdcBlacklistV1>((result) => {
		return {
			tag: "intent_usdc_blacklist_v1" as const,
			id: result.id,
			success: result.success,
			account_address: getAddress(result.account_address),
		};
	});
}
