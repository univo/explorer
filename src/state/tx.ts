import type { RpcTransaction } from "viem";

import { rpc } from "@/helpers";
import { numberToHex } from "@/utils";

export type Tx = RpcTransaction<false>;

export async function getTx(opts: { block: number; tx: number }): Promise<Tx> {
	const tx = await rpc({
		id: 1,
		jsonrpc: "2.0",
		method: "eth_getTransactionByBlockNumberAndIndex",
		params: [numberToHex(opts.block), numberToHex(opts.tx)],
	});

	if (tx === null) {
		throw new Error("Unknown transaction");
	}

	return tx;
}
