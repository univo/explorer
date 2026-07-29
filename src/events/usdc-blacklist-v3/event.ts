import { asc, inArray, sql } from "drizzle-orm";
import { decodeFunctionData, getAddress, isAddressEqual, parseAbiItem, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { isHexEqual, nonNullable } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v3 } from "@/indexes/account-v3";
import { createId, getEventSuccess, parseId } from "@/helpers";

export interface UsdcBlacklistV3 {
	tag: "usdc_blacklist_v3";
	id: string;
	success: boolean;
	account_address: `0x${string}`;
}

const USDC_DEPLOYED_BLOCK = 6082465;
const USDC_ADDRESS = getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");

const BLACKLIST_ABI = parseAbiItem("function blacklist(address _account)");
const BLACKLIST_SELECTOR = toFunctionSelector(BLACKLIST_ABI);

export const event = univo.event({
	id: "usdc_blacklist_v3",

	filters: [
		{
			chain: 1,
			address: USDC_ADDRESS,
			fromBlock: USDC_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions
			.map((tx) => {
				try {
					if (tx.to === null || !isAddressEqual(tx.to, USDC_ADDRESS) || !tx.input.startsWith(BLACKLIST_SELECTOR)) {
						return null;
					}

					const { args } = decodeFunctionData({ abi: [BLACKLIST_ABI], data: tx.input });

					const id = createId({
						logIndex: TRANSACTION_EVENT,
						chainId: block.eth_chainId,
						txIndex: tx.transactionIndex,
						tableId: TABLES.usdc_blacklist_v3,
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
	storage: index_account_v3,
	id: "usdc_blacklist_v3_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: USDC_ADDRESS },
				{ event_id: event.id, account: event.account_address },
			];
		});
	},
});

export async function getUsdcBlacklistV3(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.usdc_blacklist_v3);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<UsdcBlacklistV3>((result) => {
		return {
			tag: "usdc_blacklist_v3" as const,
			id: result.id,
			success: result.success,
			account_address: getAddress(result.account_address),
		};
	});
}
