import { and, asc, inArray } from "drizzle-orm";
import { decodeFunctionData, getAddress, hexToNumber, isAddressEqual, parseAbiItem, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { inTuple } from "@/db/types";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v4 } from "@/indexes/index_account_v4";
import { createId, getEventSuccess, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface IntentUsdcBlacklistV2 {
	tag: "intent_usdc_blacklist_v2";
	id: string;
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	success: boolean;
	account_address: `0x${string}`;
}

const USDC_DEPLOYED_BLOCK = 6082465;
const USDC_ADDRESS = getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");

const BLACKLIST_ABI = parseAbiItem("function blacklist(address _account)");
const BLACKLIST_SELECTOR = toFunctionSelector(BLACKLIST_ABI);

export const event = univo.event({
	id: "intent_usdc_blacklist_v2",

	filters: [
		{
			chain: 1,
			address: USDC_ADDRESS,
			fromBlock: USDC_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap<IntentUsdcBlacklistV2>((tx) => {
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
					tableId: TABLES.intent_usdc_blacklist_v2,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionIndex, tx.transactionIndex));

				return {
					tag: "intent_usdc_blacklist_v2",
					id,
					log_index: hexToNumber(TRANSACTION_EVENT),
					chain: hexToNumber(block.eth_chainId),
					tx_index: hexToNumber(tx.transactionIndex),
					block_number: hexToNumber(block.eth_getBlockByNumber.number),
					block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
					success: getEventSuccess(receipt),
					account_address: getAddress(args[0]),
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
	id: "intent_usdc_blacklist_v2_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v4,
	id: "intent_usdc_blacklist_v2_index_account_v4",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: USDC_ADDRESS },
				{ event_id: event.id, account: event.account_address },
			];
		});
	},
});

export async function getIntentUsdcBlacklistV2(ids: string[]) {
	const mapped = ids.map((id) => parseId(id));
	const filtered = mapped.filter((id) => id.tableId === TABLES.intent_usdc_blacklist_v2);

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
					filtered.map((event) => new Date(event.blockTimestamp * 1000)),
				),
				inTuple(
					[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
					filtered.map((event) => [new Date(event.blockTimestamp * 1000), event.blockNumber, event.txIndex, event.logIndex, event.chainId]),
				),
			),
		)
		.orderBy(asc(table.block_timestamp), asc(table.block_number), asc(table.tx_index), asc(table.log_index), asc(table.chain));

	return rows.map<IntentUsdcBlacklistV2>((row) => {
		const id = createId({
			chainId: numberToHex(row.chain),
			txIndex: numberToHex(row.tx_index),
			tableId: TABLES.intent_usdc_blacklist_v2,
			logIndex: numberToHex(row.log_index),
			blockNumber: numberToHex(row.block_number),
			blockTimestamp: numberToHex(row.block_timestamp.getTime() / 1000),
		});

		return {
			tag: "intent_usdc_blacklist_v2",
			id,
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			success: row.success,
			account_address: getAddress(row.account_address),
		};
	});
}
