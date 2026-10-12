import type { Block } from "univo";

import { node } from "@/helpers";

export async function test_getBlock(head: { chain: `0x${string}`; number: `0x${string}` | "finalized" }): Promise<Block> {
	const [eth_getBlockByNumber, eth_getBlockReceipts] = await Promise.all([
		node.request({ method: "eth_getBlockByNumber", params: [head.number, true] }),
		node.request({ method: "eth_getBlockReceipts", params: [head.number] }),
	]);

	return {
		eth_chainId: head.chain,
		eth_getBlockByNumber,
		eth_getBlockReceipts,
	};
}
