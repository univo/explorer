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

export interface LogEnsNameForAddrChangedV2 {
	tag: "log_ens_name_for_addr_changed_v2";
	id: string;
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	name: string;
	account_address: `0x${string}`;
}

export const ENS_DEFAULT_REVERSE_REGISTRAR_ADDRESS = getAddress("0x283F227c4Bd38ecE252C4Ae7ECE650B0e913f1f9");
export const ENS_DEFAULT_REVERSE_REGISTRAR_DEPLOYED_BLOCK = 22764819;

const NAME_FOR_ADDR_CHANGED_ABI = parseAbiItem("event NameForAddrChanged(address indexed addr, string name)");

export const event = univo.event({
	id: "log_ens_name_for_addr_changed_v2",

	filters: [
		{
			chain: 1,
			address: ENS_DEFAULT_REVERSE_REGISTRAR_ADDRESS,
			event: toEventSelector(NAME_FOR_ADDR_CHANGED_ABI),
			fromBlock: ENS_DEFAULT_REVERSE_REGISTRAR_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockReceipts.flatMap((receipt) => {
			return receipt.logs.flatMap<LogEnsNameForAddrChangedV2>((log) => {
				try {
					if (!isHexEqual(log.address, ENS_DEFAULT_REVERSE_REGISTRAR_ADDRESS)) {
						return [];
					}

					if (!isHexEqual(log.topics[0], toEventSelector(NAME_FOR_ADDR_CHANGED_ABI))) {
						return [];
					}

					const { args } = decodeEventLog({
						strict: true,
						data: log.data,
						topics: log.topics,
						abi: [NAME_FOR_ADDR_CHANGED_ABI],
					});

					const id = createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: TABLES.log_ens_name_for_addr_changed_v2,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					return {
						tag: "log_ens_name_for_addr_changed_v2",
						id,
						log_index: hexToNumber(log.logIndex),
						chain: hexToNumber(block.eth_chainId),
						tx_index: hexToNumber(log.transactionIndex),
						block_number: hexToNumber(block.eth_getBlockByNumber.number),
						block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
						name: args.name,
						account_address: getAddress(args.addr),
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
	id: "log_ens_name_for_addr_changed_v2_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

export async function getLogEnsNameForAddrChangedV2(ids: string[]) {
	const mapped = ids.map((id) => parseId(id));
	const filtered = mapped.filter((id) => id.tableId === TABLES.log_ens_name_for_addr_changed_v2);

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

	return rows.map<LogEnsNameForAddrChangedV2>((row) => {
		const id = createId({
			chainId: numberToHex(row.chain),
			txIndex: numberToHex(row.tx_index),
			tableId: TABLES.log_ens_name_for_addr_changed_v2,
			logIndex: numberToHex(row.log_index),
			blockNumber: numberToHex(row.block_number),
			blockTimestamp: numberToHex(row.block_timestamp.getTime() / 1000),
		});

		return {
			tag: "log_ens_name_for_addr_changed_v2",
			id,
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			name: row.name,
			account_address: getAddress(row.account_address),
		};
	});
}
