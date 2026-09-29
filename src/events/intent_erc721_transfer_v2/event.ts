import { and, asc, inArray } from "drizzle-orm";
import {
	decodeEventLog,
	decodeFunctionData,
	getAddress,
	hexToNumber,
	parseAbi,
	parseAbiItem,
	toEventSelector,
	toFunctionSelector,
} from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { inTuple } from "@/db/types";
import type { EventId } from "@/events";
import { getEventSuccess } from "@/helpers";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v4 } from "@/indexes/index_account_v4";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface IntentErc721TransferV2 {
	tag: "intent_erc721_transfer_v2";
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	success: boolean;
	token_id: `0x${string}`;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
	caller_address: `0x${string}`;
	token_address: `0x${string}`;
}

const TRANSFER_ABI = parseAbi([
	"function transferFrom(address from, address to, uint256 tokenId)",
	"function safeTransferFrom(address from, address to, uint256 tokenId)",
	"function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
]);
const TRANSFER_SELECTORS = new Set(TRANSFER_ABI.map((item) => toFunctionSelector(item)));
const TRANSFER_EVENT_ABI = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)");
const TRANSFER_EVENT_SELECTOR = toEventSelector(TRANSFER_EVENT_ABI);

export const event = univo.event({
	id: "intent_erc721_transfer_v2",

	filters: [
		{
			chain: 1,
			fromBlock: 0,
			event: TRANSFER_EVENT_SELECTOR,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap<IntentErc721TransferV2>((tx) => {
			try {
				// When deploying a contract the `to` field is null
				if (tx.to === null) {
					return [];
				}

				if (!TRANSFER_SELECTORS.has(tx.input.slice(0, 10) as `0x${string}`)) {
					return [];
				}

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionIndex, tx.transactionIndex));

				if (receipt === undefined) {
					return [];
				}

				// ERC-20 and ERC-721 transfers share function selectors, so confirm the
				// calldata against a strictly decoded ERC-721 Transfer log.
				const { args } = decodeFunctionData({ abi: TRANSFER_ABI, data: tx.input });

				const transfer = receipt.logs.find((log) => {
					try {
						if (tx.to === null || log.address === null || log.topics[0] === null) {
							return false;
						}

						if (!isHexEqual(log.address, tx.to) || !isHexEqual(log.topics[0], TRANSFER_EVENT_SELECTOR)) {
							return false;
						}

						const decoded = decodeEventLog({
							strict: true,
							data: log.data,
							topics: log.topics,
							abi: [TRANSFER_EVENT_ABI],
						});

						const toEqual = isHexEqual(decoded.args.to, args[1]);
						const tokenIdEqual = decoded.args.tokenId === args[2];
						const fromEqual = isHexEqual(decoded.args.from, args[0]);

						return toEqual && tokenIdEqual && fromEqual;
					} catch {
						return false;
					}
				});

				if (transfer === undefined) {
					return [];
				}

				return {
					tag: "intent_erc721_transfer_v2",
					chain: hexToNumber(block.eth_chainId),
					log_index: hexToNumber(TRANSACTION_EVENT),
					tx_index: hexToNumber(tx.transactionIndex),
					block_number: hexToNumber(block.eth_getBlockByNumber.number),
					block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
					token_id: numberToHex(args[2]),
					to_address: getAddress(args[1]),
					token_address: getAddress(tx.to),
					success: getEventSuccess(receipt),
					from_address: getAddress(args[0]),
					caller_address: getAddress(tx.from),
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
	id: "intent_erc721_transfer_v2_index_block_number_tx_index_v4",
});

univo.event({
	filters: event.filters,
	storage: index_account_v4,
	id: "intent_erc721_transfer_v2_index_account_v4",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event, account: event.to_address },
				{ event, account: event.from_address },
				{ event, account: event.token_address },
				{ event, account: event.caller_address },
			];
		});
	},
});

export async function getIntentErc721TransferV2(ids: EventId[]) {
	const filtered = ids.filter((id) => TABLES[id.tag] === TABLES.intent_erc721_transfer_v2);

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

	return rows.map<IntentErc721TransferV2>((row) => {
		return {
			tag: "intent_erc721_transfer_v2",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			success: row.success,
			token_id: row.token_id,
			to_address: getAddress(row.to_address),
			from_address: getAddress(row.from_address),
			token_address: getAddress(row.token_address),
			caller_address: getAddress(row.caller_address),
		};
	});
}
