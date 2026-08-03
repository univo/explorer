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

export interface IntentAaveV3SupplyV1 {
	tag: "intent_aave_v3_supply_v1";
	id: string;
	success: boolean;
	quantity: `0x${string}`;
	referral_code: `0x${string}`;
	token_address: `0x${string}`;
	supplier_address: `0x${string}`;
	on_behalf_of_address: `0x${string}`;
}

export const AAVE_V3_ETHEREUM_POOL_DEPLOYED_BLOCK = 16291127;
export const AAVE_V3_ETHEREUM_POOL_ADDRESS = getAddress("0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2");

const SUPPLY_ABI = parseAbi([
	"function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
	"function supplyWithPermit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode, uint256 deadline, uint8 permitV, bytes32 permitR, bytes32 permitS)",
	"function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
]);

const SUPPLY_SELECTORS = new Set<string>(SUPPLY_ABI.map(toFunctionSelector));

export const event = univo.event({
	id: "intent_aave_v3_supply_v1",

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
				if (tx.to === null || !isHexEqual(tx.to, AAVE_V3_ETHEREUM_POOL_ADDRESS)) {
					return [];
				}

				if (!SUPPLY_SELECTORS.has(tx.input.slice(0, 10))) {
					return [];
				}

				const { args } = decodeFunctionData({ abi: SUPPLY_ABI, data: tx.input });

				const id = createId({
					logIndex: TRANSACTION_EVENT,
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_aave_v3_supply_v1,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionHash, tx.hash));

				return {
					id,
					quantity: numberToHex(args[1]),
					success: getEventSuccess(receipt),
					referral_code: numberToHex(args[3]),
					token_address: getAddress(args[0]),
					supplier_address: getAddress(tx.from),
					on_behalf_of_address: getAddress(args[2]),
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
							referral_code: sql.raw(`excluded.${table.referral_code.name}`),
							token_address: sql.raw(`excluded.${table.token_address.name}`),
							supplier_address: sql.raw(`excluded.${table.supplier_address.name}`),
							on_behalf_of_address: sql.raw(`excluded.${table.on_behalf_of_address.name}`),
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
	id: "intent_aave_v3_supply_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_aave_v3_supply_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: AAVE_V3_ETHEREUM_POOL_ADDRESS },
				{ event_id: event.id, account: event.token_address },
				{ event_id: event.id, account: event.supplier_address },
				{ event_id: event.id, account: event.on_behalf_of_address },
			];
		});
	},
});

export async function getIntentAaveV3SupplyV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_aave_v3_supply_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentAaveV3SupplyV1>((result) => {
		return {
			tag: "intent_aave_v3_supply_v1" as const,
			id: result.id,
			success: result.success,
			quantity: result.quantity,
			referral_code: result.referral_code,
			token_address: getAddress(result.token_address),
			supplier_address: getAddress(result.supplier_address),
			on_behalf_of_address: getAddress(result.on_behalf_of_address),
		};
	});
}
