import { defineIndexer } from "univo";
import { env } from "cloudflare:workers";
import { defineStorage } from "univo/metadata";
import { r2 } from "univo/metadata/adapters/r2-binding";
import type { RpcBlock, RpcTransactionReceipt } from "viem";

import { rpc } from "@/helpers";

const metadataStorage = defineStorage({
	adapter: r2({
		binding: env.BUCKET,
	}),
});

export const univo = defineIndexer({
	getBlock,
	quiet: false,
	metadataStorage,
	signingKey: process.env.UNIVO_SIGNING_KEY,
});

async function getBlock(block: { chain: `0x${string}`; number: string }) {
	const [eth_getBlockByNumber, eth_getBlockReceipts] = await Promise.all([
		rpc({ jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber", params: [block.number, true] }),
		rpc({ jsonrpc: "2.0", id: 2, method: "eth_getBlockReceipts", params: [block.number] }),
	]);

	if (!eth_getBlockByNumber) throw new Error("eth_getBlockByNumber is null");
	if (!eth_getBlockReceipts) throw new Error("eth_getBlockReceipts is null");

	return {
		eth_chainId: block.chain,
		eth_getBlockByNumber: eth_getBlockByNumber as RpcBlock<"latest", true>,
		eth_getBlockReceipts: eth_getBlockReceipts as RpcTransactionReceipt[],
	};
}
