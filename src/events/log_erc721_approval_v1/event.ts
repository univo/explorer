import { asc, inArray, sql } from "drizzle-orm";
import { decodeEventLog, getAddress, parseAbiItem, toEventSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { TABLES } from "@/constants";
import { createId, parseId } from "@/helpers";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface LogErc721ApprovalV1 {
	tag: "log_erc721_approval_v1";
	id: string;
	token_id: `0x${string}`;
	owner_address: `0x${string}`;
	token_address: `0x${string}`;
	spender_address: `0x${string}`;
}

const abi = parseAbiItem("event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)");

export const event = univo.event({
	id: "log_erc721_approval_v1",

	filters: [{ chain: 1, fromBlock: 0, event: toEventSelector(abi) }],

	handler: (block) => {
		return block.eth_getBlockReceipts.flatMap((receipt) => {
			return receipt.logs.flatMap<LogErc721ApprovalV1>((log) => {
				try {
					if (!isHexEqual(log.topics[0], toEventSelector(abi))) {
						return [];
					}

					const { args } = decodeEventLog({ topics: log.topics, data: log.data, strict: true, abi: [abi] });

					const id = createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: TABLES.log_erc721_approval_v1,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					return {
						tag: "log_erc721_approval_v1",
						id,
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
							token_id: sql.raw(`excluded.${table.token_id.name}`),
							owner_address: sql.raw(`excluded.${table.owner_address.name}`),
							token_address: sql.raw(`excluded.${table.token_address.name}`),
							spender_address: sql.raw(`excluded.${table.spender_address.name}`),
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
	id: "log_erc721_approval_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

export async function getLogErc721ApprovalV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.log_erc721_approval_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<LogErc721ApprovalV1>((result) => {
		return {
			tag: "log_erc721_approval_v1",
			id: result.id,
			token_id: result.token_id,
			owner_address: getAddress(result.owner_address),
			token_address: getAddress(result.token_address),
			spender_address: getAddress(result.spender_address),
		};
	});
}
