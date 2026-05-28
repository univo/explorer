import { indexer } from "univo";
import { env } from "cloudflare:workers";
import { createStorage } from "unstorage";
import kv from "unstorage/drivers/cloudflare-kv-binding";
import type { RpcBlock, RpcTransactionReceipt } from "viem";

import { raise, retry } from "@/utils";

const metadataStorage = createStorage({
	driver: kv({
		binding: env.KV,
	}),
});

export const univo = indexer({
	getBlock,
	quiet: false,
	metadataStorage,
	signingKey: process.env.UNIVO_SIGNING_KEY,
});

async function getBlock(block: { chain: `0x${string}`; number: string }) {
	const [eth_getBlockByNumber, eth_getBlockReceipts] = await Promise.all([
		retry(rpc, [{ id: 1, method: "eth_getBlockByNumber", params: [block.number, true] }], 4),
		retry(rpc, [{ id: 2, method: "eth_getBlockReceipts", params: [block.number] }], 4),
	]);

	if (!eth_getBlockByNumber) return null;
	if (!eth_getBlockReceipts) return null;

	return {
		eth_chainId: block.chain,
		eth_getBlockByNumber: eth_getBlockByNumber as RpcBlock<"latest", true>,
		eth_getBlockReceipts: eth_getBlockReceipts as RpcTransactionReceipt[],
	};
}

async function rpc(opts: { id: number; method: string; params: any[] }) {
	const res = await fetch(process.env.ETHEREUM_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ jsonrpc: "2.0", ...opts }),
	});

	if (!res.ok) throw new Error("Failed to get response from ETHEREUM_URL");
	const json: any = await res.json().catch((cause) => raise("Unable to parse json response", { cause }));

	return json.result;
}
