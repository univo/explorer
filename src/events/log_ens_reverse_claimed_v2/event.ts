import { and, asc, inArray } from "drizzle-orm";
import { decodeEventLog, getAddress, hexToNumber, parseAbiItem, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { TABLES } from "@/constants";
import { inTuple } from "@/db/types";
import { isHexEqual } from "@/utils";
import type { Id } from "@/events";
import { createPostgresClient } from "@/db/client";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface LogEnsReverseClaimedV2 {
	tag: "log_ens_reverse_claimed_v2";
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
	node: `0x${string}`;
	account_address: `0x${string}`;
}

export const ENS_REVERSE_REGISTRAR_V2_ADDRESS = getAddress("0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb");
export const ENS_REVERSE_REGISTRAR_V2_DEPLOYED_BLOCK = 16925606;

const REVERSE_CLAIMED_ABI = parseAbiItem("event ReverseClaimed(address indexed addr, bytes32 indexed node)");

export const event = univo.event({
	id: "log_ens_reverse_claimed_v2",

	filters: [
		{
			chain: 1,
			address: ENS_REVERSE_REGISTRAR_V2_ADDRESS,
			event: toEventSelector(REVERSE_CLAIMED_ABI),
			fromBlock: ENS_REVERSE_REGISTRAR_V2_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockReceipts.flatMap((receipt) => {
			return receipt.logs.flatMap<LogEnsReverseClaimedV2>((log) => {
				try {
					if (!isHexEqual(log.address, ENS_REVERSE_REGISTRAR_V2_ADDRESS)) {
						return [];
					}

					if (!isHexEqual(log.topics[0], toEventSelector(REVERSE_CLAIMED_ABI))) {
						return [];
					}

					const { args } = decodeEventLog({
						strict: true,
						data: log.data,
						topics: log.topics,
						abi: [REVERSE_CLAIMED_ABI],
					});

					return {
						tag: "log_ens_reverse_claimed_v2",
						log_index: hexToNumber(log.logIndex),
						chain: hexToNumber(block.eth_chainId),
						tx_index: hexToNumber(log.transactionIndex),
						block_number: hexToNumber(block.eth_getBlockByNumber.number),
						block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
						node: args.node,
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
	handler: (block) => event.handler(block),
	id: "log_ens_reverse_claimed_v2_index_block_number_tx_index_v4",
});

export async function getLogEnsReverseClaimedV2(ids: Id[]) {
	const filtered = ids.filter((id) => TABLES[id.tag] === TABLES.log_ens_reverse_claimed_v2);

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
					filtered.map((id) => id.block_timestamp),
				),
				inTuple(
					[table.block_timestamp, table.block_number, table.tx_index, table.log_index, table.chain],
					filtered.map((id) => [id.block_timestamp, id.block_number, id.tx_index, id.log_index, id.chain]),
				),
			),
		)
		.orderBy(asc(table.block_timestamp), asc(table.block_number), asc(table.tx_index), asc(table.log_index), asc(table.chain));

	return rows.map<LogEnsReverseClaimedV2>((row) => {
		return {
			tag: "log_ens_reverse_claimed_v2",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			node: row.node,
			account_address: getAddress(row.account_address),
		};
	});
}
