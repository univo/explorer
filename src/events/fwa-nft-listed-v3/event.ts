import { asc, inArray, sql } from "drizzle-orm";
import { decodeEventLog, getAddress, parseAbiItem, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { TABLES } from "@/constants";
import { createId, parseId } from "@/helpers";
import { createPostgresClient } from "@/db/client";
import { defineBatchLoader, isHexEqual, numberToHex } from "@/utils";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";
import { FWA_ADDRESS, FWA_DEPLOYED_BLOCK } from "@/events/fwa-nft-deposited-v3/event";

export interface FwaNftListedV3 {
	tag: "fwa_nft_listed_v3";
	id: string;
	success: true;
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
	id: "fwa_nft_listed_v3",

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
			return receipt.logs.flatMap((log) => {
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

					const id = createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: TABLES.fwa_nft_listed_v3,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					return {
						id,
						slot: numberToHex(args.slot),
						weight: numberToHex(args.weight),
						token_id: numberToHex(args.tokenId),
						listing_id: numberToHex(args.listingId),
						backing_eth: numberToHex(args.value),
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
							slot: sql.raw(`excluded.${table.slot.name}`),
							weight: sql.raw(`excluded.${table.weight.name}`),
							token_id: sql.raw(`excluded.${table.token_id.name}`),
							listing_id: sql.raw(`excluded.${table.listing_id.name}`),
							backing_eth: sql.raw(`excluded.${table.backing_eth.name}`),
							depositor_address: sql.raw(`excluded.${table.depositor_address.name}`),
							collection_address: sql.raw(`excluded.${table.collection_address.name}`),
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
	id: "fwa_nft_listed_v3_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

export async function getFwaNftListedV3(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.fwa_nft_listed_v3);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<FwaNftListedV3>((result) => {
		return {
			tag: "fwa_nft_listed_v3",
			id: result.id,
			success: true,
			slot: result.slot,
			weight: result.weight,
			token_id: result.token_id,
			listing_id: result.listing_id,
			backing_eth: result.backing_eth,
			depositor_address: getAddress(result.depositor_address),
			collection_address: getAddress(result.collection_address),
		};
	});
}

export const getFwaNftListedV3ByListingId = defineBatchLoader(async (ids: readonly `0x${string}`[]) => {
	if (ids.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.listing_id, ids));

	return ids.map((id) => {
		const result = rows.find((row) => row.listing_id === id);

		if (!result) {
			return null;
		}

		return {
			tag: "fwa_nft_listed_v3",
			id: result.id,
			success: true,
			slot: result.slot,
			weight: result.weight,
			token_id: result.token_id,
			listing_id: result.listing_id,
			backing_eth: result.backing_eth,
			depositor_address: getAddress(result.depositor_address),
			collection_address: getAddress(result.collection_address),
		};
	});
});
