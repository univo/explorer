import { indexer } from "univo";
import { env } from "cloudflare:workers";
import { Storage } from "@storagesdk/core";
import type { RpcBlock, RpcTransactionReceipt } from "viem";

import { rpc } from "@/helpers";
import { retry } from "@/utils";
import { r2 } from "./storagesdk";

const metadataStorage = new Storage({
	adapter: r2({
		binding: env.BUCKET,
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
		retry(() => rpc({ jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber", params: [block.number, true] }), 4),
		retry(() => rpc({ jsonrpc: "2.0", id: 2, method: "eth_getBlockReceipts", params: [block.number] }), 4),
	]);

	if (!eth_getBlockByNumber) return null;
	if (!eth_getBlockReceipts) return null;

	return {
		eth_chainId: block.chain,
		eth_getBlockByNumber: eth_getBlockByNumber as RpcBlock<"latest", true>,
		eth_getBlockReceipts: eth_getBlockReceipts as RpcTransactionReceipt[],
	};
}
