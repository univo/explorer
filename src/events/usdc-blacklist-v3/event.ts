import { asc, inArray, sql } from "drizzle-orm";
import { decodeEventLog, getAddress, isAddressEqual, parseAbiItem, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { createPostgresClient } from "@/db/client";
import { nonNullable } from "@/utils";
import { index_account_v3 } from "@/indexes/account-v3";
import { createId, getEventSuccess, getTxReceiptForLog, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface UsdcBlacklistV3 {
	tag: "usdc_blacklist_v3";
	id: string;
	success: boolean;
	account_address: `0x${string}`;
}

const USDC_DEPLOYED_BLOCK = 6082465;
export const USDC_ADDRESS = getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");

const abi = parseAbiItem("event Blacklisted(address indexed _account)");

export const event = univo.event({
	id: "usdc_blacklist_v3",

	filters: [
		{
			chain: 1,
			address: USDC_ADDRESS,
			event: toEventSelector(abi),
			fromBlock: USDC_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockReceipts
			.flatMap((receipt) => receipt.logs)
			.filter((log) => isAddressEqual(log.address, USDC_ADDRESS) && log.topics[0] === toEventSelector(abi))
			.map((log) => {
				try {
					const { args } = decodeEventLog({ topics: log.topics, data: log.data, strict: true, abi: [abi] });

					const id = createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: tables.usdc_blacklist_v1,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					const receipt = getTxReceiptForLog(block.eth_getBlockReceipts, log);

					return {
						id,
						success: getEventSuccess(receipt),
						account_address: getAddress(args._account),
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
	storage: index_block_number_tx_index_v4,
	id: "usdc_blacklist_v3_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
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
	const filtered = ids.filter((id) => parseId(id).tableId === tables.usdc_blacklist_v1);

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
