import { numberToHex, type RpcBlock } from "viem";

import { getNode } from "@/helpers";
import type { Chain } from "@/constants";

export type Block = RpcBlock;

export async function getBlockByNumber(chain: Chain, number: number) {
	const node = getNode(chain);

	const block = await node.request({
		method: "eth_getBlockByNumber",
		params: [numberToHex(number), false],
	});

	if (block === null) {
		throw new Error("Unknown block");
	}

	return block as Block;
}
