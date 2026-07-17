import { join } from "node:path";
import { numberToHex } from "viem";
import { http } from "univo/transport";
import { promises as fs } from "node:fs";
import type { IndexerRpc } from "univo/rpc";
import type { RpcBlock, RpcTransactionReceipt } from "viem";

import { db } from "../db/client";
import { raise, retry } from "../utils";

// Eventually we should just use a local transport here to test. That would mean we don't have to start
// the frontend at all and can test events in isolation. We don't do this at the moment because of the
// module side affects issue, we want to ensure that all events are actually picked up for now.

export const test_client = http<IndexerRpc>("http://localhost:3000/api/univo", {
	signingKey: process.env.UNIVO_SIGNING_KEY,
});

const client = http("http://localhost:3000/api/univo", { signingKey: process.env.UNIVO_SIGNING_KEY });

export async function test_writeEvents(block: Block, event: string) {
	return await client.request({
		method: "private_writeEvents",
		params: [{ events: [event], blocks: [block] }],
	});
}

async function test_rpc(opts: { method: string; params: any[] }) {
	const res = await fetch(process.env.ETHEREUM_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ jsonrpc: "2.0", id: Math.floor(Math.random() * 1000), ...opts }),
	});

	if (!res.ok) throw new Error("Failed to get response from ETHEREUM_URL");
	const json: any = await res.json().catch((cause) => raise("Unable to parse json response", { cause }));

	return json.result;
}

type Block = {
	eth_chainId: `0x${string}`;
	eth_getBlockByNumber: RpcBlock<"latest", true>;
	eth_getBlockReceipts: RpcTransactionReceipt[];
};

export async function test_getBlock(block: { chain: number; block_number: number }) {
	const cacheDir = ".blocks";
	const cacheFile = join(cacheDir, `${block.chain}-${block.block_number}.json`);

	// Try to read from cache first
	try {
		const cachedData = await fs.readFile(cacheFile, "utf-8");
		return JSON.parse(cachedData) as Block;
	} catch {
		// Cache miss or invalid cache, continue to fetch from network
	}

	// Fetch from network
	const [eth_getBlockByNumber, eth_getBlockReceipts] = await Promise.all([
		retry(() => test_rpc({ method: "eth_getBlockByNumber", params: [numberToHex(block.block_number), true] }), 4),
		retry(() => test_rpc({ method: "eth_getBlockReceipts", params: [numberToHex(block.block_number)] }), 4),
	]);

	if (!eth_getBlockByNumber) throw new Error("eth_getBlockByNumber is null");
	if (!eth_getBlockReceipts) throw new Error("eth_getBlockReceipts is null");

	const blockData = { eth_chainId: numberToHex(block.chain), eth_getBlockByNumber, eth_getBlockReceipts } as Block;

	// Save to cache (non-blocking)
	saveToCache(cacheDir, cacheFile, blockData);

	return blockData;
}

async function saveToCache(cacheDir: string, cacheFile: string, blockData: Block) {
	try {
		await fs.mkdir(cacheDir, { recursive: true });
		await fs.writeFile(cacheFile, JSON.stringify(blockData, null, 2), "utf-8");
	} catch (error) {
		// Log cache write error but don't fail the function
		console.warn("Failed to write block to cache:", error);
	}
}

// TODO: Remove

export async function test_deleteEvents(block: Block, table: string) {
	const number = block.eth_getBlockByNumber.number.slice(2).padStart(8, "0");
	const timestamp = block.eth_getBlockByNumber.timestamp.slice(2).padStart(8, "0");
	const prefix = `${timestamp}-${number.slice(0, 4)}-${number.slice(4, 8)}`;

	// A clickhouse quirk here is that we need to use the `command` method to delete rows. The regular
	// `query` method adds formatting information to the query which causes the delete to fail.

	// Another clickhouse quirk is that we have to cast the id using toString. This is an issue with how
	// startsWith works with FixedString columns and internal padding.

	await db.command({ query: `DELETE FROM ${table} WHERE startsWith(toString(id), '${prefix}')` });
}

// TODO: Remove

// Normally we use our index tables to determine ids based on search queries, but for testing
// purposes we don't want to rely on those external tables. Instead we can actually directly look
// up events using a prefix search based on the block information that makes up the id for each event
export async function test_getEventIdsForBlock(block: Block, table: string) {
	const number = block.eth_getBlockByNumber.number.slice(2).padStart(8, "0");
	const timestamp = block.eth_getBlockByNumber.timestamp.slice(2).padStart(8, "0");
	const prefix = `${timestamp}-${number.slice(0, 4)}-${number.slice(4, 8)}`;

	// Clickhouse quirk is that we have to cast the id using toString. This is an issue with how
	// startsWith works with FixedString columns and internal padding.

	const query = `SELECT * FROM ${table} WHERE startsWith(toString(id), '${prefix}')`;
	const res = await db.query({ query, format: "JSONEachRow" });
	const rows: { id: string }[] = await res.json();

	return rows.map((row) => row.id);
}

// TODO: Remove

// Normally we use our index tables to determine ids based on search queries, but for testing
// purposes we don't want to rely on those external tables. Instead we can actually directly look
// up events using a prefix search based on the block information that makes up the id for each event
export async function test_v2_getEventIdsForBlock(block: Block, table: string) {
	const timestamp = block.eth_getBlockByNumber.timestamp.slice(2).padStart(8, "0");
	const number = block.eth_getBlockByNumber.number.slice(2).padStart(8, "0");
	const prefix = `${timestamp}${number}`;

	// Clickhouse quirk is that we have to cast the id using toString. This is an issue with how
	// startsWith works with FixedString columns and internal padding.

	const query = `SELECT lower(hex(id)), success FROM ${table} WHERE startsWith(toString(id), unhex('${prefix}'))`;
	const res = await db.query({ query, format: "JSONEachRow" });
	const rows: { "lower(hex(id))": string }[] = await res.json();

	return rows.map((row) => row["lower(hex(id))"]);
}
