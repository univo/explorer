import type { Block } from "univo";

import { arbitrum, ethereum } from "@/helpers";

export async function test_getBlock(head: { chain: `0x${string}`; number: `0x${string}` | "finalized" }): Promise<Block> {
	if (head.chain === "0x1") {
		const [eth_getBlockByNumber, eth_getBlockReceipts] = await Promise.all([
			ethereum.request({ method: "eth_getBlockByNumber", params: [head.number, true] }),
			ethereum.request({ method: "eth_getBlockReceipts", params: [head.number] }),
		]);

		return {
			eth_chainId: head.chain,
			eth_getBlockByNumber,
			eth_getBlockReceipts,
		};
	}

	if (head.chain === "0xa4b1") {
		const [eth_getBlockByNumber, eth_getBlockReceipts] = await Promise.all([
			arbitrum.request({ method: "eth_getBlockByNumber", params: [head.number, true] }),
			arbitrum.request({ method: "eth_getBlockReceipts", params: [head.number] }),
		]);

		return {
			eth_chainId: head.chain,
			eth_getBlockByNumber,
			eth_getBlockReceipts,
		};
	}

	throw new Error(`Requesting unsupported chain ${head.chain}`);
}
