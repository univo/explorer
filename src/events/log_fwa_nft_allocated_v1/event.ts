import { asc, inArray, sql } from "drizzle-orm";
import { decodeEventLog, getAddress, parseAbiItem, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { TABLES } from "@/constants";
import { createId, parseId } from "@/helpers";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_account_v3 } from "@/indexes/account-v3";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";
import { FWA_ADDRESS, FWA_DEPLOYED_BLOCK } from "@/events/intent_fwa_deposited_v1/event";

export interface LogFwaNftAllocatedV1 {
	tag: "log_fwa_nft_allocated_v1";
	id: string;
	success: true;
	listing_id: `0x${string}`;
	backing_eth: `0x${string}`;
	purchaser_address: `0x${string}`;
	depositor_address: `0x${string}`;
}

const NFT_ALLOCATED_ABI = parseAbiItem(
	"event NFTAllocated(uint256 indexed requestId, uint256 indexed listingId, address indexed purchaser, address depositor, uint256 value, uint256 randomWord)",
);

export const event = univo.event({
	id: "log_fwa_nft_allocated_v1",

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
			return receipt.logs.flatMap((log) => {
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
						tableId: TABLES.log_fwa_nft_allocated_v1,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					return {
						id,
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
							listing_id: sql.raw(`excluded.${table.listing_id.name}`),
							backing_eth: sql.raw(`excluded.${table.backing_eth.name}`),
							purchaser_address: sql.raw(`excluded.${table.purchaser_address.name}`),
							depositor_address: sql.raw(`excluded.${table.depositor_address.name}`),
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
	id: "log_fwa_nft_allocated_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

// We do something slightly unique with this log event. FWA is designed in a way that it doesn't directly
// react to external events, and rather runs at its own pace. This is correct and good system design, but
// slightly complicates indexing. Users submit their intent to win (acquire) a deposit. The result of this
// bet isn't actually fulfilled until a later transaction where FWA processes those acquisitions as capacity
// from Chainlink's VRF becomes available. We want this result to show for both the winner (purchaser_address)
// and the loser (depositor_address). This is why we also add the log event to our account index.

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "log_fwa_nft_allocated_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.depositor_address },
				{ event_id: event.id, account: event.purchaser_address },
			];
		});
	},
});

export async function getLogFwaNftAllocatedV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.log_fwa_nft_allocated_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<LogFwaNftAllocatedV1>((result) => {
		return {
			tag: "log_fwa_nft_allocated_v1",
			id: result.id,
			success: true,
			listing_id: result.listing_id,
			backing_eth: result.backing_eth,
			purchaser_address: getAddress(result.purchaser_address),
			depositor_address: getAddress(result.depositor_address),
		};
	});
}
