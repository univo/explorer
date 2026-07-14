"use server";

import DataLoader from "dataloader";
import { mainnet } from "viem/chains";
import { createPublicClient } from "viem";

import { logger } from "@/utils";
import { db } from "@/db/client";
import { createTransport } from "@/transports";

// CREATE TABLE state_tokens_v1 (
// 	   `chain` UInt32,
//     `address` FixedString(42),
//     `name` String,
//     `symbol` String,
//     `decimals` Nullable(UInt8),
//     `image` Nullable(String),
// )
// ENGINE = ReplacingMergeTree
// ORDER BY (chain, address);

export interface Token {
	chain: number;
	name: string | null;
	image: string | null;
	symbol: string | null;
	address: `0x${string}`;
	decimals: number | null;
}

const clients = {
	1: createPublicClient({ chain: mainnet, transport: createTransport(process.env.ETHEREUM_URL) }),
};

const abi = [
	{ inputs: [], name: "name", type: "function", stateMutability: "view", outputs: [{ type: "string" }] },
	{ inputs: [], name: "symbol", type: "function", stateMutability: "view", outputs: [{ type: "string" }] },
	{ inputs: [], type: "function", name: "decimals", stateMutability: "view", outputs: [{ type: "uint8" }] },
] as const;

const loader = new DataLoader<{ chain: keyof typeof clients; address: `0x${string}` }, Token>(
	async (tokens) => {
		if (tokens.length === 0) return [];

		// 1. Clear the loader cache to ensure fresh data
		loader.clearAll();

		// 2. Determine unique tokens
		const unique: Record<string, true> = {};

		const filtered = tokens.filter((token) => {
			if (unique[token.chain + token.address]) return false;
			unique[token.chain + token.address] = true;
			return true;
		});

		const mapped = filtered.map((token) => `(${token.chain}, '${token.address.toLowerCase()}')`);

		// 3. Fetch tokens from cache
		const res = await db.query({
			query: `SELECT * FROM state_tokens_v1 WHERE (chain, address) IN (${mapped.join(",")});`,
			format: "JSONEachRow",
		});

		const rows: any[] = await res.json();

		logger.debug(`Loaded ${rows.length} state_tokens_v1 after requesting ${mapped.length}`);

		const writes: Token[] = [];

		const reads = tokens.map<Promise<Token>>(async ({ chain, address }) => {
			try {
				const row = rows.find((r) => r.chain === chain && r.address === address.toLowerCase());

				if (row) {
					return {
						chain,
						address,
						name: row.name,
						image: row.image,
						symbol: row.symbol,
						decimals: row.decimals,
					};
				}

				const [name, symbol, decimals] = await Promise.all([
					clients[chain].readContract({ abi, address, functionName: "name" }),
					clients[chain].readContract({ abi, address, functionName: "symbol" }),
					clients[chain].readContract({ abi, address, functionName: "decimals" }),
				]);

				const token: Token = {
					chain,
					name,
					symbol,
					decimals,
					image: null,
					address: address.toLowerCase() as `0x${string}`,
				};

				writes.push(token);

				return token;
			} catch {
				const token: Token = {
					chain,
					address,
					name: null,
					image: null,
					symbol: null,
					decimals: null,
				};

				return token;
			}
		});

		const results = await Promise.all(reads);

		// 4. Write new tokens to cache
		try {
			if (writes.length > 0) {
				await db.insert({ table: "state_tokens_v1", format: "JSONEachRow", values: writes });
				logger.debug(`Wrote ${writes.length} new tokens to state_tokens_v1`);
			}
		} catch {
			logger.error("Failed to write new tokens to cache");
		}

		return results;
	},
	{
		// @ts-expect-error incorrect types for cacheKeyFn
		// https://github.com/graphql/dataloader/blob/main/examples/GoogleDatastore.md
		cacheKeyFn: (key) => JSON.stringify(key),
	},
);

export async function getToken(opts: { chain: number; address: `0x${string}` }) {
	return await loader.load(opts as { chain: keyof typeof clients; address: `0x${string}` });
}
