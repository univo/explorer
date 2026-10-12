import { numberToHex, type RpcBlock } from "viem";

import { node } from "@/helpers";

export type Block = RpcBlock;

export async function getBlockByNumber(number: number) {
	const block = await node.request({
		method: "eth_getBlockByNumber",
		params: [numberToHex(number), false],
	});

	if (block === null) {
		throw new Error("Unknown block");
	}

	return block as Block;
}
