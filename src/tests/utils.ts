import { numberToHex } from "viem";
import { http } from "univo/transport";
import type { IndexerRpc } from "univo/rpc";
import type { RpcBlock, RpcTransactionReceipt } from "viem";

import { raise, retry } from "../utils";

// Eventually we should just use a local transport here to test. That would mean we don't have to start
// the frontend at all and can test events in isolation. We don't do this at the moment because of the
// module side affects issue, we want to ensure that all events are actually picked up for now.

export const test_client = http<IndexerRpc>("http://localhost:3000/api/univo", {
	signingKey: process.env.UNIVO_SIGNING_KEY,
});

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
	const [eth_getBlockByNumber, eth_getBlockReceipts] = await Promise.all([
		retry(() => test_rpc({ method: "eth_getBlockByNumber", params: [numberToHex(block.block_number), true] }), 4),
		retry(() => test_rpc({ method: "eth_getBlockReceipts", params: [numberToHex(block.block_number)] }), 4),
	]);

	if (!eth_getBlockByNumber) throw new Error("eth_getBlockByNumber is null");
	if (!eth_getBlockReceipts) throw new Error("eth_getBlockReceipts is null");

	const blockData = { eth_chainId: numberToHex(block.chain), eth_getBlockByNumber, eth_getBlockReceipts } as Block;

	return blockData;
}
