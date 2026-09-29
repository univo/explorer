import { and, asc, inArray } from "drizzle-orm";
import { decodeEventLog, decodeFunctionData, getAddress, hexToNumber, parseAbiItem, toEventSelector, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { inTuple } from "@/db/types";
import type { Event } from "@/events";
import { getEventSuccess } from "@/helpers";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v4 } from "@/indexes/index_account_v4";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";
import { FWA_ADDRESS, FWA_DEPLOYED_BLOCK } from "@/events/intent_fwa_deposited_v2/event";

export interface IntentFwaWonV3 {
	tag: "intent_fwa_won_v3";
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
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
	id: "intent_fwa_won_v3",

	filters: [
		{
			chain: 1,
			address: FWA_ADDRESS,
			fromBlock: FWA_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap<IntentFwaWonV3>((tx) => {
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

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionIndex, tx.transactionIndex));
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

				return {
					tag: "intent_fwa_won_v3",
					chain: hexToNumber(block.eth_chainId),
					log_index: hexToNumber(TRANSACTION_EVENT),
					tx_index: hexToNumber(tx.transactionIndex),
					block_number: hexToNumber(block.eth_getBlockByNumber.number),
					block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
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
	id: "intent_fwa_won_v3_index_block_number_tx_index_v4",
});

univo.event({
	filters: event.filters,
	storage: index_account_v4,
	id: "intent_fwa_won_v3_index_account_v4",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event, account: FWA_ADDRESS },
				{ event, account: event.purchaser_address },
			];
		});
	},
});

export async function getIntentFwaWonV3(events: Event[]) {
	const filtered = events.filter((event) => TABLES[event.tag] === TABLES.intent_fwa_won_v3);

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

	return rows.map<IntentFwaWonV3>((row) => {
		return {
			tag: "intent_fwa_won_v3",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			success: row.success,
			token_out: row.token_out,
			listing_id: row.listing_id,
			payout_eth: row.payout_eth,
			purchaser_address: getAddress(row.purchaser_address),
			settlement_type: row.settlement_type as "kept" | "relisted" | "accepted_eth" | "accepted_fwa",
		};
	});
}
