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

export interface IntentAaveV3WithdrawV1 {
	tag: "intent_aave_v3_withdraw_v1";
	id: string;
	success: boolean;
	quantity: `0x${string}`;
	token_address: `0x${string}`;
	recipient_address: `0x${string}`;
	withdrawer_address: `0x${string}`;
}

export const AAVE_V3_ETHEREUM_POOL_DEPLOYED_BLOCK = 16291127;
export const AAVE_V3_ETHEREUM_POOL_ADDRESS = getAddress("0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2");

const WITHDRAW_ABI = parseAbiItem("function withdraw(address asset, uint256 amount, address to)");
const WITHDRAW_SELECTOR = toFunctionSelector(WITHDRAW_ABI);

export const event = univo.event({
	id: "intent_aave_v3_withdraw_v1",

	filters: [
		{
			chain: 1,
			address: AAVE_V3_ETHEREUM_POOL_ADDRESS,
			fromBlock: AAVE_V3_ETHEREUM_POOL_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
			try {
				// When deploying a contract the `to` field is null
				if (tx.to === null) {
					return [];
				}

				if (!isHexEqual(tx.to, AAVE_V3_ETHEREUM_POOL_ADDRESS)) {
					return [];
				}

				if (!tx.input.startsWith(WITHDRAW_SELECTOR)) {
					return [];
				}

				const { args } = decodeFunctionData({ abi: [WITHDRAW_ABI], data: tx.input });

				const id = createId({
					logIndex: TRANSACTION_EVENT,
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_aave_v3_withdraw_v1,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionHash, tx.hash));

				return {
					id,
					quantity: numberToHex(args[1]),
					success: getEventSuccess(receipt),
					token_address: getAddress(args[0]),
					withdrawer_address: getAddress(tx.from),
					recipient_address: getAddress(args[2]),
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
							token_address: sql.raw(`excluded.${table.token_address.name}`),
							recipient_address: sql.raw(`excluded.${table.recipient_address.name}`),
							withdrawer_address: sql.raw(`excluded.${table.withdrawer_address.name}`),
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
	id: "intent_aave_v3_withdraw_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_aave_v3_withdraw_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.token_address },
				{ event_id: event.id, account: event.recipient_address },
				{ event_id: event.id, account: event.withdrawer_address },
				{ event_id: event.id, account: AAVE_V3_ETHEREUM_POOL_ADDRESS },
			];
		});
	},
});

export async function getIntentAaveV3WithdrawV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_aave_v3_withdraw_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentAaveV3WithdrawV1>((result) => {
		return {
			tag: "intent_aave_v3_withdraw_v1" as const,
			id: result.id,
			success: result.success,
			quantity: result.quantity,
			token_address: getAddress(result.token_address),
			withdrawer_address: getAddress(result.withdrawer_address),
			recipient_address: getAddress(result.recipient_address),
		};
	});
}
