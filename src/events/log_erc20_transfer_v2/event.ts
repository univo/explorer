import { and, asc, inArray } from "drizzle-orm";
import { decodeEventLog, getAddress, hexToNumber, parseAbiItem, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { TABLES } from "@/constants";
import { inTuple } from "@/db/types";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { getInternalChain, parseId } from "@/helpers";

export interface LogErc20TransferV2 {
	tag: "log_erc20_transfer_v2";
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	quantity: `0x${string}`;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
	token_address: `0x${string}`;
}

const abi = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");

export const event = univo.event({
	id: "log_erc20_transfer_v2",

	filters: [{ chain: 1, fromBlock: 0, event: toEventSelector(abi) }],

	handler: (block) => {
		return block.eth_getBlockReceipts.flatMap((receipt) => {
			return receipt.logs.flatMap<LogErc20TransferV2>((log) => {
				try {
					if (!isHexEqual(log.topics[0], toEventSelector(abi))) {
						return [];
					}

					const { args } = decodeEventLog({ topics: log.topics, data: log.data, strict: true, abi: [abi] });

					if (args.value === 0n) {
						return []; // Only record non-zero transfers
					}

					return {
						tag: "log_erc20_transfer_v2",
						log_index: hexToNumber(log.logIndex),
						chain: getInternalChain(block.eth_chainId),
						tx_index: hexToNumber(log.transactionIndex),
						block_number: hexToNumber(block.eth_getBlockByNumber.number),
						block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
						to_address: getAddress(args.to),
						quantity: numberToHex(args.value),
						from_address: getAddress(args.from),
						token_address: getAddress(log.address),
					};
				} catch {
					return [];
				}
			});
		});
	},
	storage: {
		async upsert(events) {
			const MAX_BATCH_SIZE = 8000;

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

export async function getLogErc20TransferV2(ids: string[]) {
	const mapped = ids.map((id) => parseId(id));

	const filtered = mapped.filter((id) => id.tableId === TABLES.log_erc20_transfer_v2);

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
					mapped.map((event) => new Date(event.blockTimestamp * 100)),
				),
				inTuple(
					[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
					mapped.map((event) => [new Date(event.blockTimestamp * 100), event.blockNumber, event.txIndex, event.logIndex, event.chainId]),
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

	return rows.map<LogErc20TransferV2>((row) => {
		return {
			tag: "log_erc20_transfer_v2",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			quantity: row.quantity,
			to_address: getAddress(row.to_address),
			from_address: getAddress(row.from_address),
			token_address: getAddress(row.token_address),
		};
	});
}
