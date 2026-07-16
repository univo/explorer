import { inArray, sql } from "drizzle-orm";
import { decodeEventLog, getAddress, parseAbiItem, toEventSelector } from "viem";

import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { schema } from "@/db/schema";
import { createPostgresClient } from "@/db/client";
import { nonNullable, numberToHex } from "@/utils";
import { getEventSuccess, getTxReceiptForLog, createId, getPartition } from "@/helpers";

export interface Erc20TransferV2 {
	tag: "erc20_transfer_v2";
	id: string;
	success: boolean;
	quantity: `0x${string}`;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
	token_address: `0x${string}`;
}

const abi = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");

export const event = univo.event({
	id: "erc20_transfer_v3",

	filters: [{ chain: 1, fromBlock: 0, event: toEventSelector(abi) }],

	handler: (block) => {
		return block.eth_getBlockReceipts
			.flatMap((receipt) => receipt.logs)
			.filter((log) => log.topics[0] === toEventSelector(abi))
			.map((log) => {
				try {
					const { args } = decodeEventLog({ topics: log.topics, data: log.data, strict: true, abi: [abi] });

					if (args.value === 0n) {
						return; // Only record non-zero transfers
					}

					const id = createId({
						logIndex: log.logIndex,
						chainId: block.eth_chainId,
						txIndex: log.transactionIndex,
						tableId: tables.erc20_transfer_v2,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					const partition = getPartition(block.eth_getBlockByNumber.timestamp);

					const receipt = getTxReceiptForLog(block.eth_getBlockReceipts, log);

					return {
						id,
						partition,
						quantity: numberToHex(args.value),
						success: getEventSuccess(receipt),
						to_address: getAddress(args.to),
						from_address: getAddress(args.from),
						token_address: getAddress(log.address),
					};
				} catch (error) {
					return null;
				}
			})
			.filter(nonNullable);
	},

	storage: {
		async upsert(batch) {
			const MAX_BATCH_SIZE = 16_000;

			const client = await createPostgresClient();

			for (let i = 0; i < batch.length; i += MAX_BATCH_SIZE) {
				await client
					.insert(schema.event_erc20_transfer_v3)
					.values(batch.slice(i, i + MAX_BATCH_SIZE))
					.onConflictDoUpdate({
						target: schema.event_erc20_transfer_v3.id,
						set: {
							success: sql.raw(`excluded.${schema.event_erc20_transfer_v3.success.name}`),
							quantity: sql.raw(`excluded.${schema.event_erc20_transfer_v3.quantity.name}`),
							to_address: sql.raw(`excluded.${schema.event_erc20_transfer_v3.to_address.name}`),
							from_address: sql.raw(`excluded.${schema.event_erc20_transfer_v3.from_address.name}`),
							token_address: sql.raw(`excluded.${schema.event_erc20_transfer_v3.token_address.name}`),
						},
					});
			}
		},

		async delete(batch) {
			const client = await createPostgresClient();

			await client.delete(schema.event_erc20_transfer_v3).where(
				inArray(
					schema.event_erc20_transfer_v3.id,
					batch.map((event) => event.id),
				),
			);
		},
	},
});
