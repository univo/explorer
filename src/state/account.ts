import DataLoader from "dataloader";

import { capitalize } from "@/utils";
import { inTuple, schema } from "@/db/schema";
import { createPostgresClient } from "@/db/client";
import { getAddress } from "viem";

export interface Account {
	chain: number;
	address: `0x${string}`;

	is_contract?: boolean;
	owner_project?: string;
	contract_name?: string;
	code_compiler?: string;
	code_language?: string;
	deployment_tx?: string;
	deployer_block?: string;
	usage_category?: string;
	deployer_address?: string;
	source_code_verified?: string;

	erc_type?: string;
	"erc20.name"?: string;
	"erc20.symbol"?: string;
	"erc20.decimals"?: string;
}

const loader = new DataLoader<{ chain: number; address: `0x${string}` }, Account | null>(
	async (accounts) => {
		if (accounts.length === 0) return [];

		// 1. Clear the loader cache to ensure fresh data
		loader.clearAll();

		// 2. Determine unique accounts
		const unique: Record<string, true> = {};

		const filtered = accounts.filter((account) => {
			const key = [account.chain, getAddress(account.address)].join(":");

			if (unique[key]) {
				return false;
			}

			unique[key] = true;

			return true;
		});

		// 3. Fetch accounts
		const client = await createPostgresClient();

		const rows = await client
			.select()
			.from(schema.state_accounts_v3)
			.where(
				inTuple(
					[schema.state_accounts_v3.chain, schema.state_accounts_v3.address],
					filtered.map((account) => [account.chain, getAddress(account.address)]),
				),
			);

		return accounts.map(({ chain, address }) => {
			const row = rows.find((row) => row.chain === chain && row.address === address.toLowerCase());

			if (!row) {
				return null;
			}

			const account: Account = {
				chain,
				address,
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

export async function getAccount(opts: { chain: number; address: `0x${string}` }) {
	return await loader.load(opts);
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
