"use server";

import DataLoader from "dataloader";

import { db } from "@/db/client";
import { logger } from "@/utils";

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
	label: string | null;
	name_tag: string | null;
}

const loader = new DataLoader<{ chain: number; address: `0x${string}` }, Account>(
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

		// The dataset uses lowercased addresses instead of checksummed
		const mapped = filtered.map((account) => `(${account.chain}, '${account.address.toLowerCase()}')`);

		// 3. Fetch accounts
		const res = await db.query({
			query: `SELECT * FROM state_accounts_v1 WHERE (chain, address) IN (${mapped.join(",")});`,
			format: "JSONEachRow",
		});

		const rows: any[] = await res.json();

		logger.debug(`Loaded ${rows.length} state_accounts_v1 after requesting ${mapped.length}`);

		return accounts.map(({ chain, address }) => {
			const row = rows.find((r) => r.chain === chain && r.address === address.toLowerCase());

			if (row) {
				return {
					chain,
					address,
					label: row.label,
					name_tag: row.name_tag,
				};
			}

			return {
				chain,
				address,
				label: null,
				name_tag: null,
			};
		});
	},
	{
		// @ts-expect-error incorrect types for cacheKeyFn
		// https://github.com/graphql/dataloader/blob/main/examples/GoogleDatastore.md
		cacheKeyFn: (key) => JSON.stringify(key),
	},
);

// We can only export async functions when using the "use server" directive
export async function getAccount(opts: { chain: number; address: `0x${string}` }) {
	return await loader.load(opts);
}
