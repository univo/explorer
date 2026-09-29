import { and, asc, inArray } from "drizzle-orm";
import { decodeEventLog, getAddress, hexToNumber, parseAbiItem, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { TABLES } from "@/constants";
import { inTuple } from "@/db/types";
import type { Event } from "@/events";
import { createPostgresClient } from "@/db/client";
import { defineLoader, isHexEqual, numberToHex } from "@/utils";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";
import { FWA_ADDRESS, FWA_DEPLOYED_BLOCK } from "@/events/intent_fwa_deposited_v2/event";

export interface LogFwaNftListedV2 {
	tag: "log_fwa_nft_listed_v2";
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	slot: `0x${string}`;
	weight: `0x${string}`;
	token_id: `0x${string}`;
	listing_id: `0x${string}`;
	backing_eth: `0x${string}`;
	depositor_address: `0x${string}`;
	collection_address: `0x${string}`;
}

const NFT_LISTED_ABI = parseAbiItem(
	"event NFTListed(uint256 indexed listingId, uint256 indexed slot, address indexed depositor, address collection, uint256 tokenId, uint256 weight, uint256 value)",
);

export const event = univo.event({
	id: "log_fwa_nft_listed_v2",

	filters: [
		{
			chain: 1,
			address: FWA_ADDRESS,
			fromBlock: FWA_DEPLOYED_BLOCK,
			event: toEventSelector(NFT_LISTED_ABI),
		},
	],

	handler: (block) => {
		return block.eth_getBlockReceipts.flatMap((receipt) => {
			return receipt.logs.flatMap<LogFwaNftListedV2>((log) => {
				try {
					if (!isHexEqual(log.address, FWA_ADDRESS) || !isHexEqual(log.topics[0], toEventSelector(NFT_LISTED_ABI))) {
						return [];
					}

					const { args } = decodeEventLog({
						abi: [NFT_LISTED_ABI],
						data: log.data,
						topics: log.topics,
						strict: true,
					});

					return {
						tag: "log_fwa_nft_listed_v2",
						log_index: hexToNumber(log.logIndex),
						chain: hexToNumber(block.eth_chainId),
						tx_index: hexToNumber(log.transactionIndex),
						block_number: hexToNumber(block.eth_getBlockByNumber.number),
						block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
						slot: numberToHex(args.slot),
						weight: numberToHex(args.weight),
						token_id: numberToHex(args.tokenId),
						backing_eth: numberToHex(args.value),
						listing_id: numberToHex(args.listingId),
						depositor_address: getAddress(args.depositor),
						collection_address: getAddress(args.collection),
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
	handler: (block) => event.handler(block),
	id: "log_fwa_nft_listed_v2_index_block_number_tx_index_v4",
});

export async function getLogFwaNftListedV2(events: Event[]) {
	const filtered = events.filter((event) => TABLES[event.tag] === TABLES.log_fwa_nft_listed_v2);

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
					filtered.map((event) => event.block_timestamp),
				),
				inTuple(
					[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
					filtered.map((event) => [event.block_timestamp, event.block_number, event.tx_index, event.log_index, event.chain]),
				),
			),
		)
		.orderBy(asc(table.block_timestamp), asc(table.block_number), asc(table.tx_index), asc(table.log_index), asc(table.chain));

	return rows.map<LogFwaNftListedV2>((row) => {
		return {
			tag: "log_fwa_nft_listed_v2",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			slot: row.slot,
			weight: row.weight,
			token_id: row.token_id,
			listing_id: row.listing_id,
			backing_eth: row.backing_eth,
			depositor_address: getAddress(row.depositor_address),
			collection_address: getAddress(row.collection_address),
		};
	});
}

export const getFwaListingById = defineLoader(async (ids: readonly `0x${string}`[]) => {
	if (ids.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client.selectDistinct().from(table).where(inArray(table.listing_id, ids));

	return ids.map<LogFwaNftListedV2 | null>((id) => {
		const row = rows.find((row) => isHexEqual(row.listing_id, id));

		if (row === undefined) {
			return null;
		}

		return {
			tag: "log_fwa_nft_listed_v2",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			slot: row.slot,
			weight: row.weight,
			token_id: row.token_id,
			listing_id: row.listing_id,
			backing_eth: row.backing_eth,
			depositor_address: getAddress(row.depositor_address),
			collection_address: getAddress(row.collection_address),
		};
	});
});
