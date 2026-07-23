import { asc, inArray, sql } from "drizzle-orm";
import { decodeFunctionData, getAddress, isAddressEqual, parseAbiItem, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { nonNullable, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_account_v3 } from "@/indexes/account-v3";
import { getEventSuccess, createId, parseId } from "@/helpers";
import { getTornadoCashPool } from "@/events/tornado-cash-deposit-v3/event";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface TornadoCashWithdrawalV3 {
	tag: "tornado_cash_withdrawal_v3";
	id: string;
	success: boolean;
	fee: `0x${string}`;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
	pool_address: `0x${string}`;
	relayer_address: `0x${string}`;
	recipient_address: `0x${string}`;
}

const TORNADO_CASH_DEPLOYED_BLOCK = 9116966;

export const event = univo.event({
	id: "tornado_cash_withdrawal_v3",

	filters: [{ chain: 1, fromBlock: TORNADO_CASH_DEPLOYED_BLOCK }],

	handler(block) {
		return block.eth_getBlockByNumber.transactions
			.map((tx) => {
				try {
					if (tx.to === null) {
						return null;
					}

					const withdrawal = getTornadoCashWithdrawal(tx.to, tx.input);

					if (withdrawal === null) {
						return null;
					}

					const id = createId({
						logIndex: "0x0",
						chainId: block.eth_chainId,
						txIndex: tx.transactionIndex,
						tableId: tables.tornado_cash_withdrawal_v1,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === tx.hash);

					return {
						id,
						to_address: getAddress(tx.to),
						fee: numberToHex(withdrawal.fee),
						success: getEventSuccess(receipt),
						from_address: getAddress(tx.from),
						pool_address: withdrawal.pool.pool,
						relayer_address: getAddress(withdrawal.relayer),
						recipient_address: getAddress(withdrawal.recipient),
					};
				} catch {
					return null;
				}
			})
			.filter(nonNullable);
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
							fee: sql.raw(`excluded.${table.fee.name}`),
							success: sql.raw(`excluded.${table.success.name}`),
							to_address: sql.raw(`excluded.${table.to_address.name}`),
							from_address: sql.raw(`excluded.${table.from_address.name}`),
							pool_address: sql.raw(`excluded.${table.pool_address.name}`),
							relayer_address: sql.raw(`excluded.${table.relayer_address.name}`),
							recipient_address: sql.raw(`excluded.${table.recipient_address.name}`),
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
	id: "tornado_cash_withdrawal_v3_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "tornado_cash_withdrawal_v3_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.to_address },
				{ event_id: event.id, account: event.from_address },
				{ event_id: event.id, account: event.pool_address },
				{ event_id: event.id, account: event.relayer_address },
				{ event_id: event.id, account: event.recipient_address },
			];
		});
	},
});

export async function getTornadoCashWithdrawalV3(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === tables.tornado_cash_withdrawal_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<TornadoCashWithdrawalV3>((result) => {
		return {
			tag: "tornado_cash_withdrawal_v3" as const,
			id: result.id,
			fee: result.fee,
			success: result.success,
			to_address: getAddress(result.to_address),
			from_address: getAddress(result.from_address),
			pool_address: getAddress(result.pool_address),
			relayer_address: getAddress(result.relayer_address),
			recipient_address: getAddress(result.recipient_address),
		};
	});
}

const DIRECT_WITHDRAWAL_ABI = parseAbiItem(
	"function withdraw(bytes _proof, bytes32 _root, bytes32 _nullifierHash, address _recipient, address _relayer, uint256 _fee, uint256 _refund)",
);
const PROXY_WITHDRAWAL_ABI = parseAbiItem(
	"function withdraw(address _tornado, bytes _proof, bytes32 _root, bytes32 _nullifierHash, address _recipient, address _relayer, uint256 _fee, uint256 _refund)",
);

const PROXY_WITHDRAWAL_SELECTOR = toFunctionSelector(PROXY_WITHDRAWAL_ABI);
const DIRECT_WITHDRAWAL_SELECTOR = toFunctionSelector(DIRECT_WITHDRAWAL_ABI);

function getTornadoCashWithdrawal(to: `0x${string}`, input: `0x${string}`) {
	if (input.startsWith(DIRECT_WITHDRAWAL_SELECTOR)) {
		const pool = getTornadoCashPool(to);

		if (pool === undefined) {
			return null;
		}

		const decoded = decodeFunctionData({ abi: [DIRECT_WITHDRAWAL_ABI], data: input });

		return {
			pool,
			fee: decoded.args[5],
			relayer: decoded.args[4],
			recipient: decoded.args[3],
		};
	}

	if (input.startsWith(PROXY_WITHDRAWAL_SELECTOR)) {
		if (isWithdrawalProxy(to) === false) {
			return null;
		}

		const decoded = decodeFunctionData({ abi: [PROXY_WITHDRAWAL_ABI], data: input });
		const pool = getTornadoCashPool(decoded.args[0]);

		if (pool === undefined) {
			return null;
		}

		return {
			pool,
			fee: decoded.args[6],
			relayer: decoded.args[5],
			recipient: decoded.args[4],
		};
	}

	return null;
}

const WITHDRAWAL_PROXY_ADDRESSES = [
	"0x905b63Fff465B9fFBF41DeA908CEb12478ec7601",
	"0x722122dF12D4e14e13Ac3b6895a86e84145b6967",
	"0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b",
] as const;

function isWithdrawalProxy(address: `0x${string}`) {
	return WITHDRAWAL_PROXY_ADDRESSES.some((proxy) => isAddressEqual(proxy, address));
}
