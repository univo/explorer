import type { RpcTransactionReceipt } from "viem";

import { chains, inverted_chains } from "./constants";
import { formatNumber, hexToNumber, raise } from "./utils";

export function getEventSuccess(receipt: RpcTransactionReceipt | undefined) {
	if (receipt === undefined) throw new Error("No receipt");

	// Correctly the types suggest that `status` is always available on the receipt. This is only true for
	// blocks after the Byzantium upgrade in 2017 at block 4,370,000.

	// We have to use the `in` syntax here to prevent univo returning an 'incomplete_error'. This occurs
	// because we attempt to read a property on an object that doesn't exist. Which the impl detail of univo
	// uses to determine if new properties of the block are being accessed during historical indexes.
	if ("status" in receipt) return receipt.status === "0x1";

	// At the moment we default to this being true. This could be misleading for events before the upgrade if
	// they actually did fail (there might be a different way to detect this?). The reasoning is that data
	// this old is less important to be equally as accurate as fresher data.
	return true;
}

export function getTxReceiptForLog(receipts: RpcTransactionReceipt[], log: RpcTransactionReceipt["logs"][number]) {
	// For each log we like to determine whether not it was emitted as part of a successful transaction.
	// To check this we need to verify the success status of the receipt.

	// To match a specific log to a specific receipt we can match on either the log `transactionHash` or
	// `transactionIndex`. Both functionally mean the same thing. However, it is an optimisation to use
	// the `transactionIndex` because the data size is much smaller than the `transactionHash`. This
	// improvement has a pretty significant impact because any data read on each log is multiplied by
	// the number of logs.

	const receipt = receipts.find((receipt) => receipt.transactionIndex === log.transactionIndex);

	if (receipt === undefined) throw new Error("Expected receipt to be defined");

	return receipt;
}

type IdOptions = {
	blockTimestamp: `0x${string}`;
	blockNumber: `0x${string}`;
	txIndex: `0x${string}`;
	logIndex: `0x${string}`;
	chainId: `0x${string}`;
	tableId: number;
};

export function createId(opts: IdOptions) {
	const blockTimestamp = opts.blockTimestamp.slice(2).padStart(8, "0");
	const blockNumber = opts.blockNumber.slice(2).padStart(8, "0");
	const txIndex = opts.txIndex.slice(2).padStart(4, "0");

	// TODO
	// This needs to be 6 chars (3 bytes). This doesn't require a schema change
	// in Postgres but it will in Clickhouse so we'll have to change after migration.
	// Can then truncate tables and re-index data.

	const logIndex = opts.logIndex.slice(2).padStart(4, "0");
	const chainId = getInternalChain(opts.chainId).toString(16).padStart(4, "0");
	const tableId = opts.tableId.toString(16).padStart(4, "0");
	return `${blockTimestamp}${blockNumber}${txIndex}${logIndex}${chainId}${tableId}`;
}

export function parseId(id: string) {
	const blockTimestamp = Number.parseInt(id.slice(0, 8), 16);
	const blockNumber = Number.parseInt(id.slice(8, 16), 16);
	const txIndex = Number.parseInt(id.slice(16, 20), 16);
	const logIndex = Number.parseInt(id.slice(20, 24), 16);
	const chainId = getExternalChain(Number.parseInt(id.slice(24, 28), 16));
	const tableId = Number.parseInt(id.slice(28, 32), 16);
	return { blockTimestamp, blockNumber, txIndex, logIndex, chainId, tableId };
}

export function getOrderedEvents<TEvent extends { id: string }>(events: TEvent[], order: "latest" | "reverse") {
	if (order === "latest") {
		return events.sort((a, b) => {
			const _a = parseId(a.id);
			const _b = parseId(b.id);

			// Compare timestamp first
			const timestamp = _b.blockTimestamp - _a.blockTimestamp;
			if (timestamp !== 0) return timestamp;

			// Compare block number
			const block = _b.blockNumber - _a.blockNumber;
			if (block !== 0) return block;

			// Compare tx index if from same block
			const tx = _b.txIndex - _a.txIndex;
			if (tx !== 0) return tx;

			// Compare log index if from same transaction
			const log = _b.logIndex - _a.logIndex;
			if (log !== 0) return log;

			return 0; // Can't order between these two events
		});
	}

	return events.sort((a, b) => {
		const _a = parseId(a.id);
		const _b = parseId(b.id);

		// Compare timestamp first
		const timestamp = _a.blockTimestamp - _b.blockTimestamp;
		if (timestamp !== 0) return timestamp;

		// Compare block number
		const block = _a.blockNumber - _b.blockNumber;
		if (block !== 0) return block;

		// Compare tx index if from same block
		const tx = _a.txIndex - _b.txIndex;
		if (tx !== 0) return tx;

		// Compare log index if from same transaction
		const log = _a.logIndex - _b.logIndex;
		if (log !== 0) return log;

		return 0; // Can't order between these two events
	});
}

export function formatTokenAmount(quantity: `0x${string}`, decimals: number) {
	const quantityAsInteger = Number(quantity);
	const quantityAsString = String(quantityAsInteger);
	const quantityAsNumber = quantityAsInteger / 10 ** decimals;

	if (decimals > quantityAsString.length) {
		return formatNumber(quantityAsNumber, { maximumSignificantDigits: 2 });
	}

	return formatNumber(quantityAsNumber, { maximumFractionDigits: 2 });
}

/**
 * getInternalChain
 * Maps an external chain id to an internal chain identifier
 *
 * @param external_chain External chain identifier
 * @returns Internal chain identifier for the provided chain
 */
export function getInternalChain(external_chain: `0x${string}` | keyof typeof chains) {
	if (typeof external_chain === "string") {
		return (
			chains[hexToNumber(external_chain) as keyof typeof chains] ||
			raise(`Unsupported chain id ${hexToNumber(external_chain)}`)
		);
	}

	return chains[external_chain];
}

/**
 * getExternalChain
 * Maps an internal chain id back to its external chain identifier
 *
 * @param internal_chain Internal chain identifier
 * @returns External chain identifier
 */
export function getExternalChain(internal_chain: number) {
	return (
		(inverted_chains[internal_chain as keyof typeof inverted_chains] as keyof typeof chains) ||
		raise(`Unknown internal chain id ${internal_chain}`)
	);
}

export function isMobile() {
	return window.innerWidth < 768;
}

export function isDesktop() {
	return window.innerWidth >= 768;
}

export async function rpc(opts: { jsonrpc: "2.0"; id: number; method: string; params: any[] }) {
	const res = await fetch(process.env.ETHEREUM_URL, {
		method: "POST",
		body: JSON.stringify(opts),
		headers: { "Content-Type": "application/json" },
	});

	if (!res.ok) throw new Error("Failed to get response from ETHEREUM_URL");
	const json: any = await res.json().catch((cause) => raise("Unable to parse json response", { cause }));

	return json.result;
}
