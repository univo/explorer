import { and, asc, inArray } from "drizzle-orm";
import { decodeFunctionData, getAddress, hexToNumber, parseAbiItem, toFunctionSelector } from "viem";

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

export interface IntentErc20TransferV2 {
	tag: "intent_erc20_transfer_v2";
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	success: boolean;
	quantity: `0x${string}`;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
	token_address: `0x${string}`;
}

const TRANSFER_ABI = parseAbiItem("function transfer(address to, uint256 value)");
const TRANSFER_SELECTOR = toFunctionSelector(TRANSFER_ABI);

export const event = univo.event({
	id: "intent_erc20_transfer_v2",

	filters: [{ chain: 1, fromBlock: 0 }],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap<IntentErc20TransferV2>((tx) => {
			try {
				// When deploying a contract the `to` field is null
				if (tx.to === null) {
					return [];
				}

				if (!tx.input.startsWith(TRANSFER_SELECTOR)) {
					return [];
				}

				const { args } = decodeFunctionData({ abi: [TRANSFER_ABI], data: tx.input });

				if (args[1] === 0n) {
					return [];
				}

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionIndex, tx.transactionIndex));

				return {
					tag: "intent_erc20_transfer_v2",
					chain: hexToNumber(block.eth_chainId),
					log_index: hexToNumber(TRANSACTION_EVENT),
					tx_index: hexToNumber(tx.transactionIndex),
					block_number: hexToNumber(block.eth_getBlockByNumber.number),
					block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
					to_address: getAddress(args[0]),
					quantity: numberToHex(args[1]),
					success: getEventSuccess(receipt),
					from_address: getAddress(tx.from),
					token_address: getAddress(tx.to),
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
	id: "intent_erc20_transfer_v2_index_block_number_tx_index_v4",
});

univo.event({
	filters: event.filters,
	storage: index_account_v4,
	id: "intent_erc20_transfer_v2_index_account_v4",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event, account: event.to_address },
				{ event, account: event.from_address },
				{ event, account: event.token_address },
			];
		});
	},
});

export async function getIntentErc20TransferV2(ids: Id[]) {
	const filtered = ids.filter((id) => TABLES[id.tag] === TABLES.intent_erc20_transfer_v2);

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

	return rows.map<IntentErc20TransferV2>((row) => {
		return {
			tag: "intent_erc20_transfer_v2",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			success: row.success,
			quantity: row.quantity,
			to_address: getAddress(row.to_address),
			from_address: getAddress(row.from_address),
			token_address: getAddress(row.token_address),
		};
	});
}
