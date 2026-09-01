import { asc, inArray, sql } from "drizzle-orm";
import { decodeEventLog, decodeFunctionData, getAddress, parseAbiItem, toEventSelector, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_account_v3 } from "@/indexes/account-v3";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { createId, getEventSuccess, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";
import { FWA_ADDRESS, FWA_DEPLOYED_BLOCK } from "@/events/intent_fwa_deposited_v1/event";

export interface IntentFwaWonV2 {
	tag: "intent_fwa_won_v2";
	id: string;
	success: boolean;
	token_out: `0x${string}`;
	listing_id: `0x${string}`;
	payout_eth: `0x${string}`;
	purchaser_address: `0x${string}`;
	settlement_type: "kept" | "relisted" | "accepted_eth" | "accepted_fwa";
}

const KEEP_NFT_ABI = parseAbiItem("function keepNFT(uint256 listingId)");
const RELIST_NFT_ABI = parseAbiItem("function relistNFT(uint256 listingId)");
const ACCEPT_DEPOSITOR_BID_ABI = parseAbiItem("function acceptDepositorBid(uint256 listingId)");
const ACCEPT_BID_AS_TOKENS_ABI = parseAbiItem("function acceptBidAsTokens(uint256 listingId, uint256 minOut)");

const NFT_KEPT_ABI = parseAbiItem(
	"event NFTKept(uint256 indexed listingId, address indexed purchaser, address indexed depositor, uint256 backing)",
);
const NFT_RELISTED_ABI = parseAbiItem(
	"event NFTRelisted(uint256 indexed listingId, uint256 indexed newListingId, uint256 toDepositor)", //
);
const DEPOSITOR_BID_ACCEPTED_ABI = parseAbiItem(
	"event DepositorBidAccepted(uint256 indexed listingId, address indexed purchaser, address indexed depositor, uint256 payout, uint256 retained)",
);
const DEPOSITOR_BID_ACCEPTED_AS_TOKENS_ABI = parseAbiItem(
	"event DepositorBidAcceptedAsTokens(uint256 indexed listingId, address indexed purchaser, address indexed depositor, uint256 ethPayout, uint256 retained, uint256 tokenOut)",
);

const ZERO_VALUE = numberToHex(0);

export const event = univo.event({
	id: "intent_fwa_won_v2",

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
				// When deploying a contract the `to` field is null
				if (tx.to === null) {
					return [];
				}

				if (!isHexEqual(tx.to, FWA_ADDRESS)) {
					return [];
				}

				let listingId: bigint;
				let settlementType: "kept" | "relisted" | "accepted_eth" | "accepted_fwa";

				if (tx.input.startsWith(toFunctionSelector(KEEP_NFT_ABI))) {
					settlementType = "kept";
					listingId = decodeFunctionData({ abi: [KEEP_NFT_ABI], data: tx.input }).args[0];
				} else if (tx.input.startsWith(toFunctionSelector(RELIST_NFT_ABI))) {
					settlementType = "relisted";
					listingId = decodeFunctionData({ abi: [RELIST_NFT_ABI], data: tx.input }).args[0];
				} else if (tx.input.startsWith(toFunctionSelector(ACCEPT_DEPOSITOR_BID_ABI))) {
					settlementType = "accepted_eth";
					listingId = decodeFunctionData({ abi: [ACCEPT_DEPOSITOR_BID_ABI], data: tx.input }).args[0];
				} else if (tx.input.startsWith(toFunctionSelector(ACCEPT_BID_AS_TOKENS_ABI))) {
					settlementType = "accepted_fwa";
					listingId = decodeFunctionData({ abi: [ACCEPT_BID_AS_TOKENS_ABI], data: tx.input }).args[0];
				} else {
					return [];
				}

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionHash, tx.hash));
				const success = getEventSuccess(receipt);

				let tokenOut: `0x${string}` = ZERO_VALUE;
				let payoutEth: `0x${string}` = ZERO_VALUE;
				let purchaserAddress = getAddress(tx.from);

				if (success) {
					if (settlementType === "kept") {
						const log = receipt?.logs.find(
							(log) => isHexEqual(log.address, FWA_ADDRESS) && log.topics[0] === toEventSelector(NFT_KEPT_ABI),
						);

						if (log === undefined) {
							throw new Error("Expected NFTKept log");
						}

						const { args } = decodeEventLog({
							abi: [NFT_KEPT_ABI],
							data: log.data,
							topics: log.topics,
							strict: true,
						});

						payoutEth = numberToHex(args.backing);
						purchaserAddress = getAddress(args.purchaser);
					} else if (settlementType === "relisted") {
						const log = receipt?.logs.find(
							(log) => isHexEqual(log.address, FWA_ADDRESS) && log.topics[0] === toEventSelector(NFT_RELISTED_ABI),
						);

						if (log === undefined) {
							throw new Error("Expected NFTRelisted log");
						}

						const { args } = decodeEventLog({
							abi: [NFT_RELISTED_ABI],
							data: log.data,
							topics: log.topics,
							strict: true,
						});

						payoutEth = numberToHex(args.toDepositor);
					} else if (settlementType === "accepted_eth") {
						const log = receipt?.logs.find(
							(log) => isHexEqual(log.address, FWA_ADDRESS) && log.topics[0] === toEventSelector(DEPOSITOR_BID_ACCEPTED_ABI),
						);

						if (log === undefined) {
							throw new Error("Expected DepositorBidAccepted log");
						}

						const { args } = decodeEventLog({
							abi: [DEPOSITOR_BID_ACCEPTED_ABI],
							data: log.data,
							topics: log.topics,
							strict: true,
						});

						payoutEth = numberToHex(args.payout);
						purchaserAddress = getAddress(args.purchaser);
					} else {
						const log = receipt?.logs.find(
							(log) => isHexEqual(log.address, FWA_ADDRESS) && log.topics[0] === toEventSelector(DEPOSITOR_BID_ACCEPTED_AS_TOKENS_ABI),
						);

						if (log === undefined) {
							throw new Error("Expected DepositorBidAcceptedAsTokens log");
						}

						const { args } = decodeEventLog({
							abi: [DEPOSITOR_BID_ACCEPTED_AS_TOKENS_ABI],
							data: log.data,
							topics: log.topics,
							strict: true,
						});

						tokenOut = numberToHex(args.tokenOut);
						payoutEth = numberToHex(args.ethPayout);
						purchaserAddress = getAddress(args.purchaser);
					}
				}

				const id = createId({
					logIndex: TRANSACTION_EVENT,
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_fwa_won_v2,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				return {
					id,
					success,
					token_out: tokenOut,
					payout_eth: payoutEth,
					settlement_type: settlementType,
					listing_id: numberToHex(listingId),
					purchaser_address: purchaserAddress,
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
							token_out: sql.raw(`excluded.${table.token_out.name}`),
							listing_id: sql.raw(`excluded.${table.listing_id.name}`),
							payout_eth: sql.raw(`excluded.${table.payout_eth.name}`),
							settlement_type: sql.raw(`excluded.${table.settlement_type.name}`),
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
	id: "intent_fwa_won_v2_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_fwa_won_v2_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: FWA_ADDRESS },
				{ event_id: event.id, account: event.purchaser_address },
			];
		});
	},
});

export async function getIntentFwaWonV2(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_fwa_won_v2);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentFwaWonV2>((result) => {
		return {
			tag: "intent_fwa_won_v2" as const,
			id: result.id,
			success: result.success,
			token_out: result.token_out,
			listing_id: result.listing_id,
			payout_eth: result.payout_eth,
			purchaser_address: getAddress(result.purchaser_address),
			settlement_type: result.settlement_type as "kept" | "relisted" | "accepted_eth" | "accepted_fwa",
		};
	});
}
