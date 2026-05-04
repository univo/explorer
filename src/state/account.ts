import DataLoader from "dataloader";

import { db } from "@/db/client";
import { capitalize } from "@/utils";

// CREATE TABLE state_accounts_v1 (
// 	   `chain` UInt32,
//     `address` FixedString(42),
//     `label` String,
//     `name_tag` String
// )
// ENGINE = ReplacingMergeTree
// ORDER BY (chain, address);

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
			if (unique[account.chain + account.address]) return false;
			unique[account.chain + account.address] = true;
			return true;
		});

		// Open labels initiative uses lowercased addresses instead of checksummed
		const mapped = filtered.map((account) => `(${account.chain}, '${account.address.toLowerCase()}')`);

		// 3. Fetch accounts
		const res = await db.query({
			query: `SELECT chain, address, tag_id, tag_value FROM state_accounts_v3 WHERE (chain, address) IN (${mapped.join(",")});`,
			format: "JSONEachRow",
		});

		const rows: any[] = await res.json();

		return accounts.map(({ chain, address }) => {
			const relevant = rows.filter((row) => row.chain === chain && row.address === address.toLowerCase());

			if (relevant.length === 0) {
				return null;
			}

			const account: any = {
				chain,
				address,
			};

			for (const tag of relevant) {
				account[tag.tag_id] = tag.tag_value;
			}

			return account as Account;
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
