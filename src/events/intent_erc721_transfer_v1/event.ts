import { asc, inArray, sql } from "drizzle-orm";
import { decodeEventLog, decodeFunctionData, getAddress, parseAbi, parseAbiItem, toEventSelector, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v3 } from "@/indexes/account-v3";
import { createId, getEventSuccess, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface IntentErc721TransferV1 {
	tag: "intent_erc721_transfer_v1";
	id: string;
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
	id: "intent_erc721_transfer_v1",

	filters: [
		{
			chain: 1,
			fromBlock: 0,
			event: TRANSFER_EVENT_SELECTOR,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
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

				// Again, this intent is slightly different because the `transferFrom` function signature is shared
				// between the ERC20 and ERC721 interfaces. Thankfully, the emitted Transfer logs are different
				// so we use those to differentiate between the two intents

				// The caveat here is that we will not record an intent if the transaction fails before
				// emitting the necessary logs. This is rare so i'm fine with this.

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

				const id = createId({
					logIndex: TRANSACTION_EVENT,
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_erc721_transfer_v1,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				return {
					id,
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
							token_id: sql.raw(`excluded.${table.token_id.name}`),
							to_address: sql.raw(`excluded.${table.to_address.name}`),
							from_address: sql.raw(`excluded.${table.from_address.name}`),
							token_address: sql.raw(`excluded.${table.token_address.name}`),
							caller_address: sql.raw(`excluded.${table.caller_address.name}`),
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
	id: "intent_erc721_transfer_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_erc721_transfer_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.to_address },
				{ event_id: event.id, account: event.from_address },
				{ event_id: event.id, account: event.token_address },
				{ event_id: event.id, account: event.caller_address },
			];
		});
	},
});

export async function getIntentErc721TransferV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_erc721_transfer_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentErc721TransferV1>((result) => {
		return {
			tag: "intent_erc721_transfer_v1" as const,
			id: result.id,
			success: result.success,
			token_id: result.token_id,
			to_address: getAddress(result.to_address),
			from_address: getAddress(result.from_address),
			token_address: getAddress(result.token_address),
			caller_address: getAddress(result.caller_address),
		};
	});
}
