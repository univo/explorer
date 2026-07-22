import { asc, inArray, sql } from "drizzle-orm";
import { decodeFunctionData, getAddress, isAddressEqual, parseAbiItem, parseUnits, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { nonNullable, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_account_v3 } from "@/indexes/account-v3";
import { getEventSuccess, createId, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface TornadoCashDepositV3 {
	tag: "tornado_cash_deposit_v3";
	id: string;
	success: boolean;
	commitment: `0x${string}`;
	quantity: `0x${string}`;
	asset_symbol: string;
	asset_decimals: number;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
	pool_address: `0x${string}`;
}

type Pool = {
	address: `0x${string}`;
	symbol: string;
	decimals: number;
	denomination: string;
};

const TORNADO_CASH_DEPLOYED_BLOCK = 9116966;
const TORNADO_CASH_DEPOSIT_LOG_INDEX = "0xffffff";

const directDepositAbi = parseAbiItem("function deposit(bytes32 _commitment)");
const proxyDepositAbi = parseAbiItem("function deposit(address _tornado, bytes32 _commitment, bytes _encryptedNote)");

const directDepositSelector = toFunctionSelector(directDepositAbi);
const proxyDepositSelector = toFunctionSelector(proxyDepositAbi);

const pools = [
	{ symbol: "ETH", decimals: 18, denomination: "0.1", address: "0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc" },
	{ symbol: "ETH", decimals: 18, denomination: "1", address: "0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936" },
	{ symbol: "ETH", decimals: 18, denomination: "10", address: "0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF" },
	{ symbol: "ETH", decimals: 18, denomination: "100", address: "0xA160cdAB225685dA1d56aa342Ad8841c3b53f291" },
	{ symbol: "DAI", decimals: 18, denomination: "100", address: "0xD4B88Df4D29F5CedD6857912842cff3b20C8Cfa3" },
	{ symbol: "DAI", decimals: 18, denomination: "1000", address: "0xFD8610d20aA15b7B2E3Be39B396a1bC3516c7144" },
	{ symbol: "DAI", decimals: 18, denomination: "10000", address: "0x07687e702b410Fa43f4cB4Af7FA097918ffD2730" },
	{ symbol: "DAI", decimals: 18, denomination: "100000", address: "0x23773E65ed146A459791799d01336DB287f25334" },
	{ symbol: "cDAI", decimals: 8, denomination: "5000", address: "0x22aaA7720ddd5388A3c0A3333430953C68f1849b" },
	{ symbol: "cDAI", decimals: 8, denomination: "50000", address: "0x03893a7c7463AE47D46bc7f091665f1893656003" },
	{ symbol: "cDAI", decimals: 8, denomination: "500000", address: "0x2717c5e28cf931547B621a5dddb772Ab6A35B701" },
	{ symbol: "cDAI", decimals: 8, denomination: "5000000", address: "0xD21be7248e0197Ee08E0c20D4a96DEBdaC3D20Af" },
	{ symbol: "USDC", decimals: 6, denomination: "100", address: "0xd96f2B1c14Db8458374d9Aca76E26c3D18364307" },
	{ symbol: "USDC", decimals: 6, denomination: "1000", address: "0x4736dCf1b7A3d580672CcE6E7c65cd5cc9cFBa9D" },
	{ symbol: "USDT", decimals: 6, denomination: "100", address: "0x169AD27A470D064DEDE56a2D3ff727986b15D52B" },
	{ symbol: "USDT", decimals: 6, denomination: "1000", address: "0x0836222F2B2B24A3F36f98668Ed8F0B38D1a872f" },
	{ symbol: "WBTC", decimals: 8, denomination: "0.1", address: "0x178169B423a011fff22B9e3F3abeA13414dDD0F1" },
	{ symbol: "WBTC", decimals: 8, denomination: "1", address: "0x610B717796ad172B316836AC95a2ffad065CeaB4" },
	{ symbol: "WBTC", decimals: 8, denomination: "10", address: "0xbB93e510BbCD0B7beb5A853875f9eC60275CF498" },
] satisfies Pool[];

const depositProxyAddresses = [
	"0x905b63Fff465B9fFBF41DeA908CEb12478ec7601",
	"0x722122dF12D4e14e13Ac3b6895a86e84145b6967",
	"0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b",
] as const;

export const event = univo.event({
	id: "tornado_cash_deposit_v3",

	filters: [{ chain: 1, fromBlock: TORNADO_CASH_DEPLOYED_BLOCK }],

	handler(block) {
		return block.eth_getBlockByNumber.transactions
			.map((tx) => {
				try {
					if (tx.to === null) return null;

					const deposit = getTornadoCashDeposit(tx.to, tx.input);
					if (deposit === null) return null;

					const id = createId({
						chainId: block.eth_chainId,
						txIndex: tx.transactionIndex,
						logIndex: TORNADO_CASH_DEPOSIT_LOG_INDEX,
						tableId: tables.tornado_cash_deposit_v1,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === tx.hash);

					return {
						id,
						success: getEventSuccess(receipt),
						commitment: deposit.commitment,
						quantity: numberToHex(parseUnits(deposit.pool.denomination, deposit.pool.decimals)),
						asset_symbol: deposit.pool.symbol,
						asset_decimals: deposit.pool.decimals,
						to_address: getAddress(tx.to),
						from_address: getAddress(tx.from),
						pool_address: deposit.pool.address,
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
							success: sql.raw(`excluded.${table.success.name}`),
							commitment: sql.raw(`excluded.${table.commitment.name}`),
							quantity: sql.raw(`excluded.${table.quantity.name}`),
							asset_symbol: sql.raw(`excluded.${table.asset_symbol.name}`),
							asset_decimals: sql.raw(`excluded.${table.asset_decimals.name}`),
							to_address: sql.raw(`excluded.${table.to_address.name}`),
							from_address: sql.raw(`excluded.${table.from_address.name}`),
							pool_address: sql.raw(`excluded.${table.pool_address.name}`),
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
	id: "tornado_cash_deposit_v3_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "tornado_cash_deposit_v3_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.from_address },
				{ event_id: event.id, account: event.to_address },
				{ event_id: event.id, account: event.pool_address },
			];
		});
	},
});

function getTornadoCashDeposit(to: `0x${string}`, input: `0x${string}`) {
	if (input.startsWith(directDepositSelector)) {
		const pool = getPool(to);
		if (pool === undefined) return null;

		const decoded = decodeFunctionData({ abi: [directDepositAbi], data: input });

		return { pool, commitment: decoded.args[0] };
	}

	if (input.startsWith(proxyDepositSelector)) {
		if (isDepositProxy(to) === false) return null;

		const decoded = decodeFunctionData({ abi: [proxyDepositAbi], data: input });
		const pool = getPool(decoded.args[0]);

		if (pool === undefined) return null;

		return { pool, commitment: decoded.args[1] };
	}

	return null;
}

function getPool(address: `0x${string}`) {
	return pools.find((pool) => isAddressEqual(pool.address, address));
}

function isDepositProxy(address: `0x${string}`) {
	return depositProxyAddresses.some((proxy) => isAddressEqual(proxy, address));
}

export async function getTornadoCashDepositV3(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === tables.tornado_cash_deposit_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client.select().from(table).where(inArray(table.id, filtered)).orderBy(asc(table.id));

	return rows.map<TornadoCashDepositV3>((result) => {
		return {
			tag: "tornado_cash_deposit_v3" as const,
			id: result.id,
			success: result.success,
			commitment: result.commitment,
			quantity: result.quantity,
			asset_symbol: result.asset_symbol,
			asset_decimals: result.asset_decimals,
			to_address: getAddress(result.to_address),
			from_address: getAddress(result.from_address),
			pool_address: getAddress(result.pool_address),
		};
	});
}
