import { asc, inArray, sql } from "drizzle-orm";
import { decodeFunctionData, getAddress, isAddressEqual, parseAbiItem, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { tables } from "@/constants";
import { nonNullable } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { index_account_v3 } from "@/indexes/account-v3";
import { getEventSuccess, createId, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

// TODO
// Events based on a interpretting a single transaction should have a unique logIndex that indicates this.
// This allow us to identify it and not show its "logIndex" on the transactions view page. It also indicates
// the event has less specificity than the other and should be ordered first

export interface TornadoCashDepositV3 {
	tag: "tornado_cash_deposit_v3";
	id: string;
	success: boolean;
	to_address: `0x${string}`;
	from_address: `0x${string}`;
	pool_address: `0x${string}`;
}

export type TornadoCashPool = {
	address: `0x${string}`;
	assetAddress: `0x${string}`;
	quantity: bigint;
};

const TORNADO_CASH_DEPLOYED_BLOCK = 9116966;

const assets = {
	ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
	DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
	cDAI: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
	USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
	USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
	WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
} as const;

const directDepositAbi = parseAbiItem("function deposit(bytes32 _commitment)");
const proxyDepositAbi = parseAbiItem("function deposit(address _tornado, bytes32 _commitment, bytes _encryptedNote)");

const directDepositSelector = toFunctionSelector(directDepositAbi);
const proxyDepositSelector = toFunctionSelector(proxyDepositAbi);

const pools = [
	{
		assetAddress: assets.ETH,
		quantity: 100_000_000_000_000_000n,
		address: "0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc",
	},
	{
		assetAddress: assets.ETH,
		quantity: 1_000_000_000_000_000_000n,
		address: "0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936",
	},
	{
		assetAddress: assets.ETH,
		quantity: 10_000_000_000_000_000_000n,
		address: "0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF",
	},
	{
		assetAddress: assets.ETH,
		quantity: 100_000_000_000_000_000_000n,
		address: "0xA160cdAB225685dA1d56aa342Ad8841c3b53f291",
	},
	{
		assetAddress: assets.DAI,
		quantity: 100_000_000_000_000_000_000n,
		address: "0xD4B88Df4D29F5CedD6857912842cff3b20C8Cfa3",
	},
	{
		assetAddress: assets.DAI,
		quantity: 1_000_000_000_000_000_000_000n,
		address: "0xFD8610d20aA15b7B2E3Be39B396a1bC3516c7144",
	},
	{
		assetAddress: assets.DAI,
		quantity: 10_000_000_000_000_000_000_000n,
		address: "0x07687e702b410Fa43f4cB4Af7FA097918ffD2730",
	},
	{
		assetAddress: assets.DAI,
		quantity: 100_000_000_000_000_000_000_000n,
		address: "0x23773E65ed146A459791799d01336DB287f25334",
	},
	{
		assetAddress: assets.cDAI,
		quantity: 500_000_000_000n,
		address: "0x22aaA7720ddd5388A3c0A3333430953C68f1849b",
	},
	{
		assetAddress: assets.cDAI,
		quantity: 5_000_000_000_000n,
		address: "0x03893a7c7463AE47D46bc7f091665f1893656003",
	},
	{
		assetAddress: assets.cDAI,
		quantity: 50_000_000_000_000n,
		address: "0x2717c5e28cf931547B621a5dddb772Ab6A35B701",
	},
	{
		assetAddress: assets.cDAI,
		quantity: 500_000_000_000_000n,
		address: "0xD21be7248e0197Ee08E0c20D4a96DEBdaC3D20Af",
	},
	{
		assetAddress: assets.USDC,
		quantity: 100_000_000n,
		address: "0xd96f2B1c14Db8458374d9Aca76E26c3D18364307",
	},
	{
		assetAddress: assets.USDC,
		quantity: 1_000_000_000n,
		address: "0x4736dCf1b7A3d580672CcE6E7c65cd5cc9cFBa9D",
	},
	{
		assetAddress: assets.USDT,
		quantity: 100_000_000n,
		address: "0x169AD27A470D064DEDE56a2D3ff727986b15D52B",
	},
	{
		assetAddress: assets.USDT,
		quantity: 1_000_000_000n,
		address: "0x0836222F2B2B24A3F36f98668Ed8F0B38D1a872f",
	},
	{
		assetAddress: assets.WBTC,
		quantity: 10_000_000n,
		address: "0x178169B423a011fff22B9e3F3abeA13414dDD0F1",
	},
	{ assetAddress: assets.WBTC, quantity: 100_000_000n, address: "0x610B717796ad172B316836AC95a2ffad065CeaB4" },
	{ assetAddress: assets.WBTC, quantity: 1_000_000_000n, address: "0xbB93e510BbCD0B7beb5A853875f9eC60275CF498" },
] satisfies TornadoCashPool[];

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
					if (tx.to === null) {
						return null;
					}

					const deposit = getTornadoCashDeposit(tx.to, tx.input);

					if (deposit === null) {
						return null;
					}

					const id = createId({
						logIndex: "0x0",
						chainId: block.eth_chainId,
						txIndex: tx.transactionIndex,
						tableId: tables.tornado_cash_deposit_v1,
						blockNumber: block.eth_getBlockByNumber.number,
						blockTimestamp: block.eth_getBlockByNumber.timestamp,
					});

					const receipt = block.eth_getBlockReceipts.find((receipt) => receipt.transactionHash === tx.hash);

					return {
						id,
						to_address: getAddress(tx.to),
						success: getEventSuccess(receipt),
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
		const pool = getTornadoCashPool(to);

		if (pool === undefined) {
			return null;
		}

		decodeFunctionData({ abi: [directDepositAbi], data: input });

		return { pool };
	}

	if (input.startsWith(proxyDepositSelector)) {
		if (isDepositProxy(to) === false) {
			return null;
		}

		const decoded = decodeFunctionData({ abi: [proxyDepositAbi], data: input });
		const pool = getTornadoCashPool(decoded.args[0]);

		if (pool === undefined) {
			return null;
		}

		return { pool };
	}

	return null;
}

export function getTornadoCashPool(address: `0x${string}`) {
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

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<TornadoCashDepositV3>((result) => {
		return {
			tag: "tornado_cash_deposit_v3" as const,
			id: result.id,
			success: result.success,
			to_address: getAddress(result.to_address),
			from_address: getAddress(result.from_address),
			pool_address: getAddress(result.pool_address),
		};
	});
}
