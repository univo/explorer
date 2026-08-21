import { asc, inArray, sql } from "drizzle-orm";
import { decodeFunctionData, getAddress, isAddressEqual, parseAbiItem, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { iife, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v3 } from "@/indexes/account-v3";
import { getEventSuccess, createId, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface IntentTornadoWithdrawalV1 {
	tag: "intent_tornado_withdrawal_v1";
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
	id: "intent_tornado_withdrawal_v1",

	filters: [{ chain: 1, fromBlock: TORNADO_CASH_DEPLOYED_BLOCK }],

	handler(block) {
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
			try {
				// When deploying a contract the `to` field is null
				if (tx.to === null) {
					return [];
				}

				const withdrawal = iife(() => {
					if (tx.to === null) {
						return null;
					}

					if (tx.input.startsWith(DIRECT_WITHDRAWAL_SELECTOR)) {
						const pool = getTornadoCashPool(tx.to);

						if (pool === undefined) {
							return null;
						}

						const decoded = decodeFunctionData({ abi: [DIRECT_WITHDRAWAL_ABI], data: tx.input });

						return {
							pool,
							fee: decoded.args[5],
							relayer: decoded.args[4],
							recipient: decoded.args[3],
						};
					}

					if (tx.input.startsWith(PROXY_WITHDRAWAL_SELECTOR)) {
						if (isWithdrawalProxy(tx.to) === false) {
							return null;
						}

						const decoded = decodeFunctionData({ abi: [PROXY_WITHDRAWAL_ABI], data: tx.input });
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
				});

				if (withdrawal === null) {
					return [];
				}

				const id = createId({
					chainId: block.eth_chainId,
					logIndex: TRANSACTION_EVENT,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_tornado_withdrawal_v1,
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
	id: "intent_tornado_withdrawal_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_tornado_withdrawal_v1_index_account_v3",
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

export async function getIntentTornadoWithdrawalV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_tornado_withdrawal_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentTornadoWithdrawalV1>((result) => {
		return {
			tag: "intent_tornado_withdrawal_v1" as const,
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

type TornadoCashPool = {
	pool: `0x${string}`;
	asset: `0x${string}`;
	quantity: `0x${string}`;
};

const assets = {
	ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
	DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
	cDAI: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
	USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
	USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
	WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
} as const;

const pools = [
	{ asset: assets.ETH, quantity: "0x16345785d8a0000", pool: "0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc" },
	{ asset: assets.ETH, quantity: "0xde0b6b3a7640000", pool: "0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936" },
	{ asset: assets.ETH, quantity: "0x8ac7230489e80000", pool: "0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF" },
	{ asset: assets.ETH, quantity: "0x56bc75e2d63100000", pool: "0xA160cdAB225685dA1d56aa342Ad8841c3b53f291" },
	{ asset: assets.DAI, quantity: "0x56bc75e2d63100000", pool: "0xD4B88Df4D29F5CedD6857912842cff3b20C8Cfa3" },
	{ asset: assets.DAI, quantity: "0x3635c9adc5dea00000", pool: "0xFD8610d20aA15b7B2E3Be39B396a1bC3516c7144" },
	{ asset: assets.DAI, quantity: "0x21e19e0c9bab2400000", pool: "0x07687e702b410Fa43f4cB4Af7FA097918ffD2730" },
	{ asset: assets.DAI, quantity: "0x152d02c7e14af6800000", pool: "0x23773E65ed146A459791799d01336DB287f25334" },
	{ asset: assets.cDAI, quantity: "0x746a528800", pool: "0x22aaA7720ddd5388A3c0A3333430953C68f1849b" },
	{ asset: assets.cDAI, quantity: "0x48c27395000", pool: "0x03893a7c7463AE47D46bc7f091665f1893656003" },
	{ asset: assets.cDAI, quantity: "0x2d79883d2000", pool: "0x2717c5e28cf931547B621a5dddb772Ab6A35B701" },
	{ asset: assets.cDAI, quantity: "0x1c6bf52634000", pool: "0xD21be7248e0197Ee08E0c20D4a96DEBdaC3D20Af" },
	{ asset: assets.USDC, quantity: "0x5f5e100", pool: "0xd96f2B1c14Db8458374d9Aca76E26c3D18364307" },
	{ asset: assets.USDC, quantity: "0x3b9aca00", pool: "0x4736dCf1b7A3d580672CcE6E7c65cd5cc9cFBa9D" },
	{ asset: assets.USDT, quantity: "0x5f5e100", pool: "0x169AD27A470D064DEDE56a2D3ff727986b15D52B" },
	{ asset: assets.USDT, quantity: "0x3b9aca00", pool: "0x0836222F2B2B24A3F36f98668Ed8F0B38D1a872f" },
	{ asset: assets.WBTC, quantity: "0x989680", pool: "0x178169B423a011fff22B9e3F3abeA13414dDD0F1" },
	{ asset: assets.WBTC, quantity: "0x5f5e100", pool: "0x610B717796ad172B316836AC95a2ffad065CeaB4" },
	{ asset: assets.WBTC, quantity: "0x3b9aca00", pool: "0xbB93e510BbCD0B7beb5A853875f9eC60275CF498" },
] satisfies TornadoCashPool[];

export function getTornadoCashPool(address: `0x${string}`) {
	return pools.find((pool) => isAddressEqual(pool.pool, address));
}

const DIRECT_WITHDRAWAL_ABI = parseAbiItem(
	"function withdraw(bytes _proof, bytes32 _root, bytes32 _nullifierHash, address _recipient, address _relayer, uint256 _fee, uint256 _refund)",
);
const PROXY_WITHDRAWAL_ABI = parseAbiItem(
	"function withdraw(address _tornado, bytes _proof, bytes32 _root, bytes32 _nullifierHash, address _recipient, address _relayer, uint256 _fee, uint256 _refund)",
);

const PROXY_WITHDRAWAL_SELECTOR = toFunctionSelector(PROXY_WITHDRAWAL_ABI);
const DIRECT_WITHDRAWAL_SELECTOR = toFunctionSelector(DIRECT_WITHDRAWAL_ABI);

const WITHDRAWAL_PROXY_ADDRESSES = [
	"0x905b63Fff465B9fFBF41DeA908CEb12478ec7601",
	"0x722122dF12D4e14e13Ac3b6895a86e84145b6967",
	"0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b",
] as const;

function isWithdrawalProxy(address: `0x${string}`) {
	return WITHDRAWAL_PROXY_ADDRESSES.some((proxy) => isAddressEqual(proxy, address));
}
