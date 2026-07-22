import DataLoader from "dataloader";
import { mainnet } from "viem/chains";
import { createPublicClient, getAddress } from "viem";
import { integer, pgTable, primaryKey, smallint, text } from "drizzle-orm/pg-core";

import { inTuple } from "@/db/types";
import { isHexEqual, logger } from "@/utils";
import { createTransport } from "@/transports";
import { createPostgresClient } from "@/db/client";

export interface Token {
	chain: number;
	name: string | null;
	image: string | null;
	symbol: string | null;
	address: `0x${string}`;
	decimals: number | null;
}

export const table = pgTable(
	"state_tokens_v1",
	{
		name: text(),
		image: text(),
		symbol: text(),
		decimals: smallint(),
		address: text().notNull(),
		chain: integer().notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.chain, table.address],
		}),
	],
);

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
			const key = [token.chain, token.address.toLowerCase()].join(":");

			if (unique[key]) {
				return false;
			}

			unique[key] = true;

			return true;
		});

		// 3. Fetch tokens from cache
		const client = await createPostgresClient();

		const rows = await client
			.select()
			.from(table)
			.where(
				inTuple(
					[table.chain, table.address],
					filtered.map((token) => [token.chain, token.address.toLowerCase()]),
				),
			);

		logger.debug(`Loaded ${rows.length} state_tokens_v1 after requesting ${filtered.length}`);

		const writes: Token[] = [];

		const reads = tokens.map<Promise<Token>>(async ({ chain, address }) => {
			try {
				const row = rows.find((r) => r.chain === chain && isHexEqual(r.address as `0x`, address));

				if (row) {
					return {
						chain,
						name: row.name,
						image: row.image,
						symbol: row.symbol,
						decimals: row.decimals,
						address: getAddress(address),
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
					address: getAddress(address),
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
				await client.insert(table).values(writes).onConflictDoNothing();
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
