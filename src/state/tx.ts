import type { RpcTransaction, RpcTransactionReceipt } from "viem";

import { numberToHex } from "@/utils";
import type { Chain } from "@/constants";
import { getNode } from "@/helpers";

export type Tx = RpcTransaction<false>;

export async function getTxByHash(opts: { chain: Chain; hash: `0x${string}` }) {
	const node = getNode(opts.chain);

	const tx = await node.request({
		method: "eth_getTransactionByHash",
		params: [opts.hash],
	});

	if (tx === null) {
		throw new Error("Unknown transaction");
	}

	if (tx.blockNumber === null || tx.transactionIndex === null) {
		throw new Error("Transaction is pending");
	}

	return tx as Tx;
}

export async function getTxByPosition(opts: { chain: Chain; block: number; tx: number }) {
	const node = getNode(opts.chain);

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

export async function getTxReceiptByHash(opts: { chain: Chain; hash: `0x${string}` }) {
	const node = getNode(opts.chain);

	const receipt = await node.request({
		method: "eth_getTransactionReceipt",
		params: [opts.hash],
	});

	if (receipt === null) {
		throw new Error("Unknown transaction");
	}

	return receipt as TxReceipt;
}
