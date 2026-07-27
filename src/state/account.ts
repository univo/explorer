import { getAddress } from "viem";
import { sql } from "drizzle-orm";
import DataLoader from "dataloader";
import { waitUntil } from "cloudflare:workers";
import { boolean, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

import { inTuple } from "@/db/types";
import { getClient } from "@/clients";
import type { Chain } from "@/constants";
import { createPostgresClient } from "@/db/client";
import { capitalize, defined, iife, isHexEqual, type MakeNonNullable } from "@/utils";

export interface Account {
	chain: number;
	address: `0x${string}`;

	is_contract: boolean | undefined;
	owner_project: string | undefined;
	contract_name: string | undefined;
	code_compiler: string | undefined;
	code_language: string | undefined;
	deployment_tx: string | undefined;
	deployer_block: string | undefined;
	usage_category: string | undefined;
	deployer_address: string | undefined;
	source_code_verified: string | undefined;

	erc_type: string | undefined;

	"erc20.name": string | undefined;
	"erc20.symbol": string | undefined;
	"erc20.decimals": string | undefined;

	"erc721.name": string | undefined;
	"erc721.symbol": string | undefined;
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
		"erc20.name": text("erc20.name"),
		"erc20.symbol": text("erc20.symbol"),
		"erc20.decimals": text("erc20.decimals"),
		"erc721.name": text("erc721.name"),
		"erc721.symbol": text("erc721.symbol"),
	},
	(table) => [
		primaryKey({
			columns: [table.chain, table.address],
		}),
	],
);

const loader = new DataLoader<{ chain: Chain; address: `0x${string}` }, Account | null>(
	async (accounts) => {
		if (accounts.length === 0) {
			return [];
		}

		// Determine unique accounts

		const unique: Record<string, true> = {};

		const filtered = accounts.filter((account) => {
			const key = [account.chain, account.address.toLowerCase()].join(":");

			if (unique[key]) {
				return false;
			}

			unique[key] = true;

			return true;
		});

		// Fetch accounts

		const client = await createPostgresClient();

		const rows = await client
			.select()
			.from(table)
			.where(
				inTuple(
					[table.chain, table.address],
					filtered.map((account) => [account.chain, account.address.toLowerCase()]),
				),
			);

		return accounts.map(({ chain, address }) => {
			const row = rows.find((row) => row.chain === chain && isHexEqual(row.address as `0x`, address));

			if (!row) {
				return null;
			}

			const account: Account = {
				chain,
				address: getAddress(address),
				is_contract: row.is_contract ?? undefined,
				owner_project: row.owner_project ?? undefined,
				contract_name: row.contract_name ?? undefined,
				code_compiler: row.code_compiler ?? undefined,
				code_language: row.code_language ?? undefined,
				deployment_tx: row.deployment_tx ?? undefined,
				deployer_block: row.deployer_block ?? undefined,
				usage_category: row.usage_category ?? undefined,
				deployer_address: row.deployer_address ?? undefined,
				source_code_verified: row.source_code_verified ?? undefined,
				erc_type: row.erc_type ?? undefined,
				"erc20.name": row["erc20.name"] ?? undefined,
				"erc20.symbol": row["erc20.symbol"] ?? undefined,
				"erc20.decimals": row["erc20.decimals"] ?? undefined,
				"erc721.name": row["erc721.name"] ?? undefined,
				"erc721.symbol": row["erc721.symbol"] ?? undefined,
			};

			return account;
		});
	},
	{
		// @ts-expect-error incorrect types for cacheKeyFn
		// https://github.com/graphql/dataloader/blob/main/examples/GoogleDatastore.md
		cacheKeyFn: (key) => JSON.stringify(key),
	},
);

export async function getAccount(opts: { chain: Chain; address: `0x${string}` }) {
	return await loader.load(opts);
}

// We can call this function when we are expecting an erc721 compatible account. We first attempt to load
// the erc721 related information from storage, only if that information does not exist do we load it from
// onchain and write it to storage

type Erc721Account = MakeNonNullable<
	Account,
	"is_contract" | "contract_name" | "erc_type" | "erc721.name" | "erc721.symbol"
>;

export async function getErc721(opts: { chain: Chain; address: `0x${string}` }): Promise<Erc721Account> {
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

	// Load name and symbol

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

	// Upsert new contract information to accounts table

	waitUntil(
		iife(async () => {
			const client = await createPostgresClient();

			await client
				.insert(table)
				.values({
					chain: opts.chain,
					address: opts.address,

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

	return {
		chain: opts.chain,
		address: getAddress(opts.address),

		is_contract: true,
		contract_name: name,
		"erc721.name": name,
		erc_type: '["erc721"]',
		"erc721.symbol": symbol,

		"erc20.name": undefined,
		code_compiler: undefined,
		code_language: undefined,
		deployment_tx: undefined,
		owner_project: undefined,
		deployer_block: undefined,
		"erc20.symbol": undefined,
		usage_category: undefined,
		"erc20.decimals": undefined,
		deployer_address: undefined,
		source_code_verified: undefined,
	};
}

export function getAccountName(account: Account) {
	if (account["erc20.name"] && account["erc20.symbol"]) {
		return `${account["erc20.name"]} (${capitalize(account["erc20.symbol"], { mode: "all" })})`;
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
