import { and, asc, inArray } from "drizzle-orm";
import { decodeEventLog, getAddress, hexToNumber, parseAbiItem, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { TABLES } from "@/constants";
import { inTuple } from "@/db/types";
import { createId, parseId } from "@/helpers";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface LogErc721ApprovalV2 {
	tag: "log_erc721_approval_v2";
	id: string;
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	token_id: `0x${string}`;
	owner_address: `0x${string}`;
	token_address: `0x${string}`;
	spender_address: `0x${string}`;
}

const abi = parseAbiItem("event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)");

export const event = univo.event({
	id: "log_erc721_approval_v2",

	filters: [{ chain: 1, fromBlock: 0, event: toEventSelector(abi) }],

	handler: (block) => {
		return block.eth_getBlockReceipts.flatMap((receipt) => {
			return receipt.logs.flatMap<LogErc721ApprovalV2>((log) => {
				try {
					if (!isHexEqual(log.topics[0], toEventSelector(abi))) {
						return [];
					}

					const { args } = decodeEventLog({ topics: log.topics, data: log.data, strict: true, abi: [abi] });

					const id = createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: TABLES.log_erc721_approval_v2,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					return {
						tag: "log_erc721_approval_v2",
						id,
						log_index: hexToNumber(log.logIndex),
						chain: hexToNumber(block.eth_chainId),
						tx_index: hexToNumber(log.transactionIndex),
						block_number: hexToNumber(block.eth_getBlockByNumber.number),
						block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
						token_id: numberToHex(args.tokenId),
						owner_address: getAddress(args.owner),
						token_address: getAddress(log.address),
						spender_address: getAddress(args.approved),
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
	id: "log_erc721_approval_v2_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

export async function getLogErc721ApprovalV2(ids: string[]) {
	const mapped = ids.map((id) => parseId(id));

	const filtered = mapped.filter((id) => id.tableId === TABLES.log_erc721_approval_v2);

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

	return rows.map<LogErc721ApprovalV2>((row) => {
		const id = createId({
			chainId: numberToHex(row.chain),
			txIndex: numberToHex(row.tx_index),
			tableId: TABLES.log_erc721_approval_v2,
			logIndex: numberToHex(row.log_index),
			blockNumber: numberToHex(row.block_number),
			blockTimestamp: numberToHex(row.block_timestamp.getTime() / 1000),
		});

		return {
			tag: "log_erc721_approval_v2",
			id,
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			token_id: row.token_id,
			owner_address: getAddress(row.owner_address),
			token_address: getAddress(row.token_address),
			spender_address: getAddress(row.spender_address),
		};
	});
}
