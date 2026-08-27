import { numberToHex, type RpcBlock } from "viem";

import { rpc } from "@/helpers";

export type Block = RpcBlock;

export async function getBlockByNumber(number: number) {
	const block = await rpc({
		id: 1,
		jsonrpc: "2.0",
		method: "eth_getBlockByNumber",
		params: [numberToHex(number), false],
	});

	if (block === null) {
		throw new Error("Unknown block");
	}

	return block as Block;
}
