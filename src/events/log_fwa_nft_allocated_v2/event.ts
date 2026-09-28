import { and, asc, inArray } from "drizzle-orm";
import { decodeEventLog, getAddress, hexToNumber, parseAbiItem, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { TABLES } from "@/constants";
import { inTuple } from "@/db/types";
import { createId, parseId } from "@/helpers";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_account_v4 } from "@/indexes/index_account_v4";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";
import { FWA_ADDRESS, FWA_DEPLOYED_BLOCK } from "@/events/intent_fwa_deposited_v1/event";

export interface LogFwaNftAllocatedV2 {
	tag: "log_fwa_nft_allocated_v2";
	id: string;
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	listing_id: `0x${string}`;
	backing_eth: `0x${string}`;
	purchaser_address: `0x${string}`;
	depositor_address: `0x${string}`;
}

const NFT_ALLOCATED_ABI = parseAbiItem(
	"event NFTAllocated(uint256 indexed requestId, uint256 indexed listingId, address indexed purchaser, address depositor, uint256 value, uint256 randomWord)",
);

export const event = univo.event({
	id: "log_fwa_nft_allocated_v2",

	filters: [
		{
			chain: 1,
			address: FWA_ADDRESS,
			fromBlock: FWA_DEPLOYED_BLOCK,
			event: toEventSelector(NFT_ALLOCATED_ABI),
		},
	],

	handler: (block) => {
		return block.eth_getBlockReceipts.flatMap((receipt) => {
			return receipt.logs.flatMap<LogFwaNftAllocatedV2>((log) => {
				try {
					if (!isHexEqual(log.address, FWA_ADDRESS) || !isHexEqual(log.topics[0], toEventSelector(NFT_ALLOCATED_ABI))) {
						return [];
					}

					const { args } = decodeEventLog({
						abi: [NFT_ALLOCATED_ABI],
						data: log.data,
						topics: log.topics,
						strict: true,
					});

					const id = createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: TABLES.log_fwa_nft_allocated_v2,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					return {
						tag: "log_fwa_nft_allocated_v2",
						id,
						log_index: hexToNumber(log.logIndex),
						chain: hexToNumber(block.eth_chainId),
						tx_index: hexToNumber(log.transactionIndex),
						block_number: hexToNumber(block.eth_getBlockByNumber.number),
						block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
						backing_eth: numberToHex(args.value),
						listing_id: numberToHex(args.listingId),
						purchaser_address: getAddress(args.purchaser),
						depositor_address: getAddress(args.depositor),
					};
				} catch {
					return [];
				}
			});
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
	id: "log_fwa_nft_allocated_v2_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

// Allocations settle asynchronously, so index the result for both the winner and the depositor.
univo.event({
	filters: event.filters,
	storage: index_account_v4,
	id: "log_fwa_nft_allocated_v2_index_account_v4",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.depositor_address },
				{ event_id: event.id, account: event.purchaser_address },
			];
		});
	},
});

export async function getLogFwaNftAllocatedV2(ids: string[]) {
	const mapped = ids.map((id) => parseId(id));
	const filtered = mapped.filter((id) => id.tableId === TABLES.log_fwa_nft_allocated_v2);

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
		.orderBy(
			asc(table.block_timestamp), //
			asc(table.block_number),
			asc(table.tx_index),
			asc(table.log_index),
			asc(table.chain),
		);

	return rows.map<LogFwaNftAllocatedV2>((row) => {
		const id = createId({
			chainId: numberToHex(row.chain),
			txIndex: numberToHex(row.tx_index),
			tableId: TABLES.log_fwa_nft_allocated_v2,
			logIndex: numberToHex(row.log_index),
			blockNumber: numberToHex(row.block_number),
			blockTimestamp: numberToHex(row.block_timestamp.getTime() / 1000),
		});

		return {
			tag: "log_fwa_nft_allocated_v2",
			id,
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			listing_id: row.listing_id,
			backing_eth: row.backing_eth,
			purchaser_address: getAddress(row.purchaser_address),
			depositor_address: getAddress(row.depositor_address),
		};
	});
}
