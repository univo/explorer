import { numberToHex, type RpcBlock } from "viem";

import { arbitrum, ethereum } from "@/helpers";
import type { Chain } from "@/constants";

export type Block = RpcBlock;

export async function getBlockByNumber(chain: Chain, number: number) {
	const node = chain === 1 ? ethereum : arbitrum;

	const block = await node.request({
		method: "eth_getBlockByNumber",
		params: [numberToHex(number), false],
	});

	if (block === null) {
		throw new Error("Unknown block");
	}

	return block as Block;
}
