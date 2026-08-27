import type { RpcTransaction, RpcTransactionReceipt } from "viem";

import { rpc } from "@/helpers";
import { numberToHex } from "@/utils";

export type Tx = RpcTransaction<false> & {
	blockTimestamp: `0x${string}`;
};

export async function getTxByPosition(opts: { block: number; tx: number }) {
	const tx = await rpc({
		id: 1,
		jsonrpc: "2.0",
		method: "eth_getTransactionByBlockNumberAndIndex",
		params: [numberToHex(opts.block), numberToHex(opts.tx)],
	});

	if (tx === null) {
		throw new Error("Unknown transaction");
	}

	return tx as Tx;
}

export type TxReceipt = RpcTransactionReceipt;

export async function getTxReceiptByHash(hash: `0x${string}`) {
	const receipt = await rpc({
		id: 1,
		jsonrpc: "2.0",
		params: [hash],
		method: "eth_getTransactionReceipt",
	});

	if (receipt === null) {
		throw new Error("Unknown transaction");
	}

	return receipt as TxReceipt;
}
