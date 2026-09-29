import { and, asc, inArray } from "drizzle-orm";
import { decodeFunctionData, getAddress, hexToNumber, isAddressEqual, parseAbiItem, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/univo";
import { inTuple } from "@/db/types";
import type { EventId } from "@/events";
import { iife, numberToHex } from "@/utils";
import { getEventSuccess } from "@/helpers";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v4 } from "@/indexes/index_account_v4";
import { index_block_number_tx_index_v4 } from "@/indexes/index_block_number_tx_index_v4";

export interface IntentTornadoWithdrawalV2 {
	tag: "intent_tornado_withdrawal_v2";
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
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
	id: "intent_tornado_withdrawal_v2",

	filters: [{ chain: 1, fromBlock: TORNADO_CASH_DEPLOYED_BLOCK }],

	handler(block) {
		return block.eth_getBlockByNumber.transactions.flatMap<IntentTornadoWithdrawalV2>((tx) => {
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

				const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === tx.hash);

				return {
					tag: "intent_tornado_withdrawal_v2",
					chain: hexToNumber(block.eth_chainId),
					log_index: hexToNumber(TRANSACTION_EVENT),
					tx_index: hexToNumber(tx.transactionIndex),
					block_number: hexToNumber(block.eth_getBlockByNumber.number),
					block_timestamp: new Date(hexToNumber(block.eth_getBlockByNumber.timestamp) * 1000),
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
	id: "intent_tornado_withdrawal_v2_index_block_number_tx_index_v4",
});

univo.event({
	filters: event.filters,
	storage: index_account_v4,
	id: "intent_tornado_withdrawal_v2_index_account_v4",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event, account: event.to_address },
				{ event, account: event.from_address },
				{ event, account: event.pool_address },
				{ event, account: event.relayer_address },
				{ event, account: event.recipient_address },
			];
		});
	},
});

export async function getIntentTornadoWithdrawalV2(ids: EventId[]) {
	const filtered = ids.filter((id) => TABLES[id.tag] === TABLES.intent_tornado_withdrawal_v2);

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

	return rows.map<IntentTornadoWithdrawalV2>((row) => {
		return {
			tag: "intent_tornado_withdrawal_v2",
			chain: row.chain,
			tx_index: row.tx_index,
			log_index: row.log_index,
			block_number: row.block_number,
			block_timestamp: row.block_timestamp,
			fee: row.fee,
			success: row.success,
			to_address: getAddress(row.to_address),
			from_address: getAddress(row.from_address),
			pool_address: getAddress(row.pool_address),
			relayer_address: getAddress(row.relayer_address),
			recipient_address: getAddress(row.recipient_address),
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
