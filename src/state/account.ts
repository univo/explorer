import { sql } from "drizzle-orm";
import { getAddress } from "viem";
import { waitUntil } from "cloudflare:workers";
import { boolean, integer, pgTable, primaryKey, smallint, text } from "drizzle-orm/pg-core";

import { inTuple } from "@/db/types";
import { getClient } from "@/clients";
import type { Chain } from "@/constants";
import type { MakeNonNullable } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { capitalize, defineLoader, defined, iife, isHexEqual } from "@/utils";

export interface Account {
	chain: number;
	address: `0x${string}`;

	is_contract: boolean | null;
	owner_project: string | null;
	contract_name: string | null;
	code_compiler: string | null;
	code_language: string | null;
	deployment_tx: string | null;
	deployer_block: string | null;
	usage_category: string | null;
	deployer_address: string | null;
	source_code_verified: string | null;

	erc_type: string | null;

	"erc20.name": string | null;
	"erc20.image": string | null;
	"erc20.symbol": string | null;
	"erc20.decimals": number | null;

	"erc721.name": string | null;
	"erc721.symbol": string | null;
}

export const table = pgTable(
	"state_accounts_v3",
	{
		chain: integer().notNull(),
		address: text().notNull(),

		is_contract: boolean(),
		owner_project: text(),
		contract_name: text(),
		code_compiler: text(),
		code_language: text(),
		deployment_tx: text(),
		deployer_block: text(),
		usage_category: text(),
		deployer_address: text(),
		source_code_verified: text(),

		erc_type: text(),

		"erc721.name": text("erc721.name"),
		"erc721.symbol": text("erc721.symbol"),

		"erc20.name": text("erc20.name"),
		"erc20.image": text("erc20.image"),
		"erc20.symbol": text("erc20.symbol"),
		"erc20.decimals": smallint("erc20.decimals"),
	},
	(table) => [
		primaryKey({
			columns: [table.chain, table.address],
		}),
	],
);

export const getAccount = defineLoader(async (accounts: readonly { chain: Chain; address: `0x${string}` }[]) => {
	if (accounts.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select()
		.from(table)
		.where(
			inTuple(
				[table.chain, table.address],
				accounts.map((account) => [account.chain, getAddress(account.address)]),
			),
		);

	return accounts.map(({ chain, address }) => {
		const row = rows.find((row) => row.chain === chain && isHexEqual(row.address as `0x`, address));

		if (row === undefined) {
			return null;
		}

		const account: Account = {
			chain,
			address: getAddress(address),

			is_contract: row.is_contract,
			owner_project: row.owner_project,
			contract_name: row.contract_name,
			code_compiler: row.code_compiler,
			code_language: row.code_language,
			deployment_tx: row.deployment_tx,
			deployer_block: row.deployer_block,
			usage_category: row.usage_category,
			deployer_address: row.deployer_address,
			source_code_verified: row.source_code_verified,

			erc_type: row.erc_type,

			"erc20.name": row["erc20.name"],
			"erc20.image": row["erc20.image"],
			"erc20.symbol": row["erc20.symbol"],
			"erc20.decimals": row["erc20.decimals"],

			"erc721.name": row["erc721.name"],
			"erc721.symbol": row["erc721.symbol"],
		};

		return account;
	});
});

// We can call this function when we are expecting an erc721 compatible account. We first attempt to load
// the erc721 related information from storage, only if that information does not exist do we load it from
// onchain and write it to storage

type Erc721Account = MakeNonNullable<
	Account, //
	"is_contract" | "contract_name" | "erc_type" | "erc721.name" | "erc721.symbol"
>;

export async function getErc721Account(opts: { chain: Chain; address: `0x${string}` }): Promise<Erc721Account | null> {
	try {
		const account = await getAccount({ chain: opts.chain, address: opts.address });

		if (
			defined(account) &&
			defined(account.erc_type) &&
			defined(account.is_contract) &&
			defined(account.contract_name) &&
			defined(account["erc721.name"]) &&
			defined(account["erc721.symbol"])
		) {
			return {
				...account,
				erc_type: account.erc_type,
				is_contract: account.is_contract,
				contract_name: account.contract_name,
				"erc721.name": account["erc721.name"],
				"erc721.symbol": account["erc721.symbol"],
			};
		}

		waitUntil(
			iife(async () => {
				// We should also be caching errors. This ensures that a single ERC20 contract that indefinitely errors
				// doesn't cause a request every time it is shown on the explorer. Once implemented we can consider
				// blocking on render while we load the name and symbol.

				const [name, symbol] = await Promise.all([
					getClient(opts.chain).readContract({
						functionName: "name",
						address: opts.address,
						abi: [
							{
								inputs: [],
								name: "name",
								type: "function",
								stateMutability: "view",
								outputs: [{ type: "string" }],
							},
						],
					}),
					getClient(opts.chain).readContract({
						address: opts.address,
						functionName: "symbol",
						abi: [
							{
								inputs: [],
								name: "symbol",
								type: "function",
								stateMutability: "view",
								outputs: [{ type: "string" }],
							},
						],
					}),
				]);

				const client = await createPostgresClient();

				await client
					.insert(table)
					.values({
						chain: opts.chain,
						address: getAddress(opts.address),

						is_contract: true,
						contract_name: name,
						"erc721.name": name,
						erc_type: '["erc721"]',
						"erc721.symbol": symbol,
					})
					.onConflictDoUpdate({
						target: [table.chain, table.address],
						set: {
							erc_type: sql.raw(`excluded.${table.erc_type.name}`),
							is_contract: sql.raw(`excluded.${table.is_contract.name}`),
							contract_name: sql.raw(`excluded.${table.contract_name.name}`),
							"erc721.name": sql`excluded.${sql.identifier(table["erc721.name"].name)}`,
							"erc721.symbol": sql`excluded.${sql.identifier(table["erc721.symbol"].name)}`,
						},
					});
			}),
		);

		return null;
	} catch {
		return null;
	}
}

type Erc20Account = MakeNonNullable<
	Account,
	"is_contract" | "contract_name" | "erc_type" | "erc20.name" | "erc20.symbol" | "erc20.decimals"
>;

export async function getErc20Account(opts: { chain: Chain; address: `0x${string}` }): Promise<Erc20Account | null> {
	try {
		const account = await getAccount({ chain: opts.chain, address: opts.address });

		if (
			defined(account) &&
			defined(account.erc_type) &&
			defined(account.is_contract) &&
			defined(account.contract_name) &&
			defined(account["erc20.name"]) &&
			defined(account["erc20.symbol"]) &&
			defined(account["erc20.decimals"])
		) {
			return {
				...account,
				erc_type: account.erc_type,
				is_contract: account.is_contract,
				contract_name: account.contract_name,
				"erc20.name": account["erc20.name"],
				"erc20.symbol": account["erc20.symbol"],
				"erc20.decimals": account["erc20.decimals"],
			};
		}

		waitUntil(
			iife(async () => {
				const [name, symbol, decimals] = await Promise.all([
					getClient(opts.chain).readContract({
						address: opts.address,
						functionName: "name",
						abi: [
							{
								inputs: [],
								name: "name",
								type: "function",
								stateMutability: "view",
								outputs: [{ type: "string" }],
							},
						],
					}),
					getClient(opts.chain).readContract({
						address: opts.address,
						functionName: "symbol",
						abi: [
							{
								inputs: [],
								name: "symbol",
								type: "function",
								stateMutability: "view",
								outputs: [{ type: "string" }],
							},
						],
					}),
					getClient(opts.chain).readContract({
						address: opts.address,
						functionName: "decimals",
						abi: [
							{
								inputs: [],
								type: "function",
								name: "decimals",
								stateMutability: "view",
								outputs: [{ type: "uint8" }],
							},
						],
					}),
				]);

				const client = await createPostgresClient();

				await client
					.insert(table)
					.values({
						chain: opts.chain,
						address: getAddress(opts.address),

						is_contract: true,
						contract_name: name,
						erc_type: '["erc20"]',
						"erc20.name": name,
						"erc20.symbol": symbol,
						"erc20.decimals": decimals,
					})
					.onConflictDoUpdate({
						target: [table.chain, table.address],
						set: {
							erc_type: sql.raw(`excluded.${table.erc_type.name}`),
							is_contract: sql.raw(`excluded.${table.is_contract.name}`),
							contract_name: sql.raw(`excluded.${table.contract_name.name}`),
							"erc20.name": sql`excluded.${sql.identifier(table["erc20.name"].name)}`,
							"erc20.symbol": sql`excluded.${sql.identifier(table["erc20.symbol"].name)}`,
							"erc20.decimals": sql`excluded.${sql.identifier(table["erc20.decimals"].name)}`,
						},
					});
			}),
		);

		return null;
	} catch {
		return null;
	}
}

export function getAccountName(account: Account) {
	if (account["erc20.name"] && account["erc20.symbol"]) {
		return `${account["erc20.name"]} (${capitalize(account["erc20.symbol"], { mode: "all" })})`;
	}

	if (account["erc721.name"] && account["erc721.symbol"]) {
		return `${account["erc721.name"]} (${capitalize(account["erc721.symbol"], { mode: "all" })})`;
	}

	if (account.owner_project && account["erc20.symbol"]) {
		return `${capitalize(account.owner_project)}: ${capitalize(account["erc20.symbol"], { mode: "all" })}`;
	}

	if (account.owner_project && account.contract_name) {
		return `${capitalize(account.owner_project)}: ${account.contract_name}`;
	}

	if (account["erc20.symbol"]) {
		return capitalize(account["erc20.symbol"], { mode: "all" });
	}

	if (account.owner_project) {
		return `${capitalize(account.owner_project)}`;
	}

	if (account.contract_name) {
		return account.contract_name;
	}

	return account.address;
}
