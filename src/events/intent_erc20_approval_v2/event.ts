import { and, asc, inArray } from "drizzle-orm";
import { decodeEventLog, decodeFunctionData, getAddress, hexToNumber, parseAbiItem, toEventSelector, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { inTuple } from "@/db/types";
import { getEventSuccess } from "@/helpers";
import type { BaseEvent } from "@/constants";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v4 } from "@/indexes/index_account_v4";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface IntentErc20ApprovalV2 {
	tag: "intent_erc20_approval_v2";
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	success: boolean;
	quantity: `0x${string}`;
	owner_address: `0x${string}`;
	token_address: `0x${string}`;
	spender_address: `0x${string}`;
}

const APPROVE_ABI = parseAbiItem("function approve(address spender, uint256 value)");
const APPROVE_SELECTOR = toFunctionSelector(APPROVE_ABI);
const APPROVAL_ABI = parseAbiItem("event Approval(address indexed owner, address indexed spender, uint256 value)");
const APPROVAL_SELECTOR = toEventSelector(APPROVAL_ABI);

export const event = univo.event({
	id: "intent_erc20_approval_v2",

	filters: [
		{
			chain: 1,
			fromBlock: 0,
			event: APPROVAL_SELECTOR,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap<IntentErc20ApprovalV2>((tx) => {
			try {
				// When deploying a contract the `to` field is null
				if (tx.to === null) {
					return [];
				}

				if (!tx.input.startsWith(APPROVE_SELECTOR)) {
					return [];
				}

				// ERC-20 and ERC-721 approvals share a function selector, so confirm the
				// calldata against a strictly decoded ERC-20 Approval log.
				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionIndex, tx.transactionIndex));

				if (receipt === undefined) {
					return [];
				}

				const { args } = decodeFunctionData({ abi: [APPROVE_ABI], data: tx.input });

				const approval = receipt.logs.find((log) => {
					try {
						if (tx.to === null || log.address === null || log.topics[0] === null) {
							return false;
						}

						if (!isHexEqual(log.address, tx.to) || !isHexEqual(log.topics[0], APPROVAL_SELECTOR)) {
							return false;
						}

						const decoded = decodeEventLog({
							strict: true,
							data: log.data,
							topics: log.topics,
							abi: [APPROVAL_ABI],
						});

						const quantityEqual = decoded.args.value === args[1];
						const ownerEqual = isHexEqual(decoded.args.owner, tx.from);
						const spenderEqual = isHexEqual(decoded.args.spender, args[0]);

						return ownerEqual && spenderEqual && quantityEqual;
					} catch {
						return false;
					}
				});

				if (approval === undefined) {
					return [];
				}

				return {
					tag: "intent_erc20_approval_v2",
					chain: hexToNumber(block.eth_chainId),
					log_index: hexToNumber(TRANSACTION_EVENT),
					tx_index: hexToNumber(tx.transactionIndex),
					block_number: hexToNumber(block.eth_getBlockByNumber.number),
					block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
					quantity: numberToHex(args[1]),
					token_address: getAddress(tx.to),
					success: getEventSuccess(receipt),
					owner_address: getAddress(tx.from),
					spender_address: getAddress(args[0]),
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
	id: "intent_erc20_approval_v2_index_block_number_tx_index_v4",
});

univo.event({
	filters: event.filters,
	storage: index_account_v4,
	id: "intent_erc20_approval_v2_index_account_v4",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event, account: event.owner_address },
				{ event, account: event.token_address },
				{ event, account: event.spender_address },
			];
		});
	},
});

export async function getIntentErc20ApprovalV2(events: BaseEvent[]) {
	const filtered = events.filter((event) => TABLES[event.tag] === TABLES.intent_erc20_approval_v2);

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

	return rows.map<IntentErc20ApprovalV2>((row) => {
		return {
			tag: "intent_erc20_approval_v2",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			success: row.success,
			quantity: row.quantity,
			owner_address: getAddress(row.owner_address),
			token_address: getAddress(row.token_address),
			spender_address: getAddress(row.spender_address),
		};
	});
}
