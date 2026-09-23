import { decodeEventLog, getAddress, parseAbiItem, toEventSelector } from "viem";
import { and, asc, inArray } from "drizzle-orm";

import { table } from "./table";
import { univo } from "@/univo";
import { TABLES } from "@/constants";
import { inTuple } from "@/db/types";
import { createId, parseId } from "@/helpers";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";

export interface LogErc20TransferV2 {
	tag: "log_erc20_transfer_v2";
	id: string;
	quantity: `0x${string}`;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
	token_address: `0x${string}`;
}

const abi = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");

function parseStorageId(id: string) {
	const parsed = parseId(id);

	return {
		chain: parsed.chainId,
		tx_index: parsed.txIndex,
		log_index: parsed.logIndex,
		block_number: parsed.blockNumber,
		block_timestamp: new Date(parsed.blockTimestamp * 1000),
	};
}

function createStorageId(row: {
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
}) {
	return createId({
		tableId: TABLES.log_erc20_transfer_v2,
		chainId: numberToHex(row.chain),
		txIndex: numberToHex(row.tx_index),
		logIndex: numberToHex(row.log_index),
		blockNumber: numberToHex(row.block_number),
		blockTimestamp: numberToHex(Math.floor(row.block_timestamp.getTime() / 1000)),
	});
}

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

					const id = createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: TABLES.log_erc20_transfer_v2,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					return {
						id,
						tag: "log_erc20_transfer_v2",
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
			const unique = new Map<string, typeof table.$inferInsert>();

			for (const event of events) {
				const position = parseStorageId(event.id);
				const key = [position.block_timestamp.getTime(), position.block_number, position.tx_index, position.log_index, position.chain].join(
					":",
				);

				unique.set(key, {
					...position,
					quantity: event.quantity,
					to_address: event.to_address,
					from_address: event.from_address,
					token_address: event.token_address,
				});
			}

			const batch = [...unique.values()];
			const client = await createPostgresClient();
			const MAX_BATCH_SIZE = 8000;

			for (let i = 0; i < batch.length; i += MAX_BATCH_SIZE) {
				await client.insert(table).values(batch.slice(i, i + MAX_BATCH_SIZE));
			}
		},

		async delete(events) {
			if (events.length === 0) return;

			const positions = events.map((event) => parseStorageId(event.id));
			const client = await createPostgresClient();

			await client.delete(table).where(
				and(
					inArray(
						table.block_timestamp,
						positions.map((position) => position.block_timestamp),
					),
					inTuple(
						[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
						positions.map((position) => [
							position.block_timestamp,
							position.block_number,
							position.tx_index,
							position.log_index,
							position.chain,
						]),
					),
				),
			);
		},
	},
});

export async function getLogErc20TransferV2(ids: string[]) {
	const positions = ids.filter((id) => parseId(id).tableId === TABLES.log_erc20_transfer_v2).map((id) => parseStorageId(id));

	if (positions.length === 0) {
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
					positions.map((position) => position.block_timestamp),
				),
				inTuple(
					[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
					positions.map((position) => [
						position.block_timestamp,
						position.block_number,
						position.tx_index,
						position.log_index,
						position.chain,
					]),
				),
			),
		)
		.orderBy(asc(table.block_timestamp), asc(table.block_number), asc(table.tx_index), asc(table.log_index), asc(table.chain));

	return rows.map<LogErc20TransferV2>((row) => {
		return {
			id: createStorageId(row),
			tag: "log_erc20_transfer_v2",
			quantity: row.quantity,
			to_address: getAddress(row.to_address),
			from_address: getAddress(row.from_address),
			token_address: getAddress(row.token_address),
		};
	});
}
