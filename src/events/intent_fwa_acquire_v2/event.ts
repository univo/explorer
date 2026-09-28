import { and, asc, inArray } from "drizzle-orm";
import { decodeFunctionData, getAddress, hexToNumber, parseAbiItem, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { inTuple } from "@/db/types";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v4 } from "@/indexes/index_account_v4";
import { createId, getEventSuccess, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";
import { FWA_ADDRESS, FWA_DEPLOYED_BLOCK } from "@/events/intent_fwa_deposited_v1/event";

export interface IntentFwaAcquireV2 {
	tag: "intent_fwa_acquire_v2";
	id: string;
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	success: boolean;
	submitted_eth: `0x${string}`;
	acquisition_count: `0x${string}`;
	purchaser_address: `0x${string}`;
}

const ACQUIRE_ABI = parseAbiItem(
	"function acquire(uint256 maxAcquisitionFee, uint256 minWeightedValue)", //
);
const ACQUIRE_WITH_SLIPPAGE_ABI = parseAbiItem(
	"function acquire(uint256 maxAcquisitionFee, uint256 minWeightedValue, uint256 maxNegativeSlippageBps)",
);
const ACQUIRE_BATCH_ABI = parseAbiItem(
	"function acquireBatch(uint256 count, uint256 maxAcquisitionFee, uint256 minWeightedValue)", //
);
const ACQUIRE_BATCH_WITH_SLIPPAGE_ABI = parseAbiItem(
	"function acquireBatch(uint256 count, uint256 maxAcquisitionFee, uint256 minWeightedValue, uint256 maxNegativeSlippageBps)",
);

export const event = univo.event({
	id: "intent_fwa_acquire_v2",

	filters: [
		{
			chain: 1,
			address: FWA_ADDRESS,
			fromBlock: FWA_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap<IntentFwaAcquireV2>((tx) => {
			try {
				if (tx.to === null || !isHexEqual(tx.to, FWA_ADDRESS)) {
					return [];
				}

				let acquisitionCount: bigint;

				if (tx.input.startsWith(toFunctionSelector(ACQUIRE_ABI))) {
					decodeFunctionData({ abi: [ACQUIRE_ABI], data: tx.input });
					acquisitionCount = 1n;
				} else if (tx.input.startsWith(toFunctionSelector(ACQUIRE_WITH_SLIPPAGE_ABI))) {
					decodeFunctionData({ abi: [ACQUIRE_WITH_SLIPPAGE_ABI], data: tx.input });
					acquisitionCount = 1n;
				} else if (tx.input.startsWith(toFunctionSelector(ACQUIRE_BATCH_ABI))) {
					acquisitionCount = decodeFunctionData({ abi: [ACQUIRE_BATCH_ABI], data: tx.input }).args[0];
				} else if (tx.input.startsWith(toFunctionSelector(ACQUIRE_BATCH_WITH_SLIPPAGE_ABI))) {
					acquisitionCount = decodeFunctionData({ abi: [ACQUIRE_BATCH_WITH_SLIPPAGE_ABI], data: tx.input }).args[0];
				} else {
					return [];
				}

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionIndex, tx.transactionIndex));

				const id = createId({
					logIndex: TRANSACTION_EVENT,
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_fwa_acquire_v2,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				return {
					tag: "intent_fwa_acquire_v2",
					id,
					log_index: hexToNumber(TRANSACTION_EVENT),
					chain: hexToNumber(block.eth_chainId),
					tx_index: hexToNumber(tx.transactionIndex),
					block_number: hexToNumber(block.eth_getBlockByNumber.number),
					block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
					submitted_eth: tx.value,
					success: getEventSuccess(receipt),
					purchaser_address: getAddress(tx.from),
					acquisition_count: numberToHex(acquisitionCount),
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
	id: "intent_fwa_acquire_v2_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v4,
	id: "intent_fwa_acquire_v2_index_account_v4",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: FWA_ADDRESS },
				{ event_id: event.id, account: event.purchaser_address },
			];
		});
	},
});

export async function getIntentFwaAcquireV2(ids: string[]) {
	const mapped = ids.map((id) => parseId(id));
	const filtered = mapped.filter((id) => id.tableId === TABLES.intent_fwa_acquire_v2);

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

	return rows.map<IntentFwaAcquireV2>((row) => {
		const id = createId({
			chainId: numberToHex(row.chain),
			txIndex: numberToHex(row.tx_index),
			tableId: TABLES.intent_fwa_acquire_v2,
			logIndex: numberToHex(row.log_index),
			blockNumber: numberToHex(row.block_number),
			blockTimestamp: numberToHex(row.block_timestamp.getTime() / 1000),
		});

		return {
			tag: "intent_fwa_acquire_v2",
			id,
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			success: row.success,
			submitted_eth: row.submitted_eth,
			acquisition_count: row.acquisition_count,
			purchaser_address: getAddress(row.purchaser_address),
		};
	});
}
