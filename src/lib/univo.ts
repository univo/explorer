import { indexer } from "univo";
import type { RpcBlock, RpcTransactionReceipt } from "viem";

import { raise, retry } from "@/utils";

export const univo = indexer({
	getBlock,
	quiet: false,
	signingKey: process.env.UNIVO_SIGNING_KEY,
});

async function getBlock(block: { chain: `0x${string}`; hash: `0x${string}`; number: `0x${string}` }) {
	const [eth_getBlockByHash, eth_getBlockReceipts] = await Promise.all([
		retry(rpc, [{ id: 1, method: "eth_getBlockByHash", params: [block.hash, true] }], 4),
		retry(rpc, [{ id: 2, method: "eth_getBlockReceipts", params: [block.hash] }], 4),
	]);

	if (!eth_getBlockByHash) throw new Error("eth_getBlockByHash is null");
	if (!eth_getBlockReceipts) throw new Error("eth_getBlockReceipts is null");

	return {
		eth_chainId: block.chain,
		eth_getBlockByHash: eth_getBlockByHash as RpcBlock<"latest", true>,
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
