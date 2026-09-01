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
import { FWA_ADDRESS, FWA_DEPLOYED_BLOCK } from "@/events/intent_fwa_deposited_v1/event";

export interface IntentFwaAcquireV1 {
	tag: "intent_fwa_acquire_v1";
	id: string;
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
	id: "intent_fwa_acquire_v1",

	filters: [
		{
			chain: 1,
			address: FWA_ADDRESS,
			fromBlock: FWA_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
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

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionHash, tx.hash));

				const id = createId({
					logIndex: TRANSACTION_EVENT,
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_fwa_acquire_v1,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				return {
					id,
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
							submitted_eth: sql.raw(`excluded.${table.submitted_eth.name}`),
							acquisition_count: sql.raw(`excluded.${table.acquisition_count.name}`),
							purchaser_address: sql.raw(`excluded.${table.purchaser_address.name}`),
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
	id: "intent_fwa_acquire_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_fwa_acquire_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: FWA_ADDRESS },
				{ event_id: event.id, account: event.purchaser_address },
			];
		});
	},
});

export async function getIntentFwaAcquireV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_fwa_acquire_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentFwaAcquireV1>((result) => {
		return {
			tag: "intent_fwa_acquire_v1",
			id: result.id,
			success: result.success,
			submitted_eth: result.submitted_eth,
			acquisition_count: result.acquisition_count,
			purchaser_address: getAddress(result.purchaser_address),
		};
	});
}
