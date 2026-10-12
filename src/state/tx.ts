import type { RpcTransaction, RpcTransactionReceipt } from "viem";

import { node } from "@/helpers";
import { numberToHex } from "@/utils";

export type Tx = RpcTransaction<false>;

export async function getTxByPosition(opts: { block: number; tx: number }) {
	const tx = await node.request({
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
	const receipt = await node.request({
		method: "eth_getTransactionReceipt",
		params: [hash],
	});

	if (receipt === null) {
		throw new Error("Unknown transaction");
	}

	return receipt as TxReceipt;
}
