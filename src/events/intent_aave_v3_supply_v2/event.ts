import { and, asc, inArray } from "drizzle-orm";
import { decodeFunctionData, getAddress, hexToNumber, parseAbi, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { inTuple } from "@/db/types";
import type { Id } from "@/events";
import { getEventSuccess } from "@/helpers";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v4 } from "@/indexes/index_account_v4";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface IntentAaveV3SupplyV2 {
	tag: "intent_aave_v3_supply_v2";
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
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
	id: "intent_aave_v3_supply_v2",

	filters: [
		{
			chain: 1,
			address: AAVE_V3_ETHEREUM_POOL_ADDRESS,
			fromBlock: AAVE_V3_ETHEREUM_POOL_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap<IntentAaveV3SupplyV2>((tx) => {
			try {
				// When deploying a contract the `to` field is null
				if (tx.to === null) {
					return [];
				}

				if (!isHexEqual(tx.to, AAVE_V3_ETHEREUM_POOL_ADDRESS)) {
					return [];
				}

				if (!SUPPLY_SELECTORS.has(tx.input.slice(0, 10))) {
					return [];
				}

				const { args } = decodeFunctionData({ abi: SUPPLY_ABI, data: tx.input });

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionIndex, tx.transactionIndex));

				return {
					tag: "intent_aave_v3_supply_v2",
					chain: hexToNumber(block.eth_chainId),
					log_index: hexToNumber(TRANSACTION_EVENT),
					tx_index: hexToNumber(tx.transactionIndex),
					block_number: hexToNumber(block.eth_getBlockByNumber.number),
					block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
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
		async upsert(events) {
			const MAX_BATCH_SIZE = 4000;
			const client = await createPostgresClient();

			for (let i = 0; i < events.length; i += MAX_BATCH_SIZE) {
				await client.insert(table).values(events.slice(i, i + MAX_BATCH_SIZE));
			}
		},

		async delete(events) {
			const client = await createPostgresClient();

			await client.delete(table).where(
				and(
					inArray(
						table.block_timestamp,
						events.map((event) => event.block_timestamp),
					),
					inTuple(
						[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
						events.map((event) => [event.block_timestamp, event.block_number, event.tx_index, event.log_index, event.chain]),
					),
				),
			);
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_tx_index_v4,
	handler: (block) => event.handler(block),
	id: "intent_aave_v3_supply_v2_index_block_number_tx_index_v4",
});

univo.event({
	filters: event.filters,
	storage: index_account_v4,
	id: "intent_aave_v3_supply_v2_index_account_v4",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ id: event, account: event.token_address },
				{ id: event, account: event.supplier_address },
				{ id: event, account: event.on_behalf_of_address },
				{ id: event, account: AAVE_V3_ETHEREUM_POOL_ADDRESS },
			];
		});
	},
});

export async function getIntentAaveV3SupplyV2(ids: Id[]) {
	const filtered = ids.filter((id) => TABLES[id.tag] === TABLES.intent_aave_v3_supply_v2);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.selectDistinct()
		.from(table)
		.where(
			and(
				inArray(
					table.block_timestamp,
					filtered.map((id) => id.block_timestamp),
				),
				inTuple(
					[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
					filtered.map((id) => [id.block_timestamp, id.block_number, id.tx_index, id.log_index, id.chain]),
				),
			),
		)
		.orderBy(asc(table.block_timestamp), asc(table.block_number), asc(table.tx_index), asc(table.log_index), asc(table.chain));

	return rows.map<IntentAaveV3SupplyV2>((row) => {
		return {
			tag: "intent_aave_v3_supply_v2",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			success: row.success,
			quantity: row.quantity,
			referral_code: row.referral_code,
			token_address: getAddress(row.token_address),
			supplier_address: getAddress(row.supplier_address),
			on_behalf_of_address: getAddress(row.on_behalf_of_address),
		};
	});
}
