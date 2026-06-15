import type { RpcTransactionReceipt } from "viem";

import { chains, inverted_chains } from "./constants";
import { formatNumber, hexToNumber, numberToHex, parseStringInt, raise } from "./utils";

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

// Clickhouse accepts duplicate primary key values and uses an eventually consistent garbage collection process to
// remove them. So to maintain correctness we also perform manual deduplication of each id here.

export function getDeduplicatedEvents<TEvent extends { id: string }>(events: TEvent[]) {
	const unique: Record<string, boolean> = {};

	return events.filter((event) => {
		if (unique[event.id]) return false;
		unique[event.id] = true;
		return true;
	});
}

interface IdOptions {
	block_timestamp: `0x${string}`;
	block_number: `0x${string}`;
	tx_index: `0x${string}`;
	log_index: `0x${string}`;
	chain_id: `0x${string}`;
	table_id: number;
}

export function createId(opts: IdOptions) {
	const block_timestamp = opts.block_timestamp.slice(2).padStart(8, "0");
	const block_number = opts.block_number.slice(2).padStart(8, "0");
	const tx_index = opts.tx_index.slice(2).padStart(4, "0");
	const log_index = opts.log_index.slice(2).padStart(4, "0");
	const chain_id = getInternalChain(opts.chain_id).toString(16).padStart(4, "0");
	const table_id = opts.table_id.toString(16).padStart(4, "0");
	return `${block_timestamp}-${block_number.slice(0, 4)}-${block_number.slice(4, 8)}-${tx_index}-${log_index}${chain_id}${table_id}`;
}

type v2_IdOptions = {
	blockTimestamp: `0x${string}`;
	blockNumber: `0x${string}`;
	txIndex: `0x${string}`;
	logIndex: `0x${string}`;
	chainId: `0x${string}`;
	tableId: number;
};

export function v2_createId(opts: v2_IdOptions) {
	const blockTimestamp = opts.blockTimestamp.slice(2).padStart(8, "0");
	const blockNumber = opts.blockNumber.slice(2).padStart(8, "0");
	const txIndex = opts.txIndex.slice(2).padStart(4, "0");
	const logIndex = opts.logIndex.slice(2).padStart(4, "0");
	const chainId = getInternalChain(opts.chainId).toString(16).padStart(4, "0");
	const tableId = opts.tableId.toString(16).padStart(4, "0");
	return `${blockTimestamp}${blockNumber}${txIndex}${logIndex}${chainId}${tableId}`;
}

/**
 * Accepts a block timestamp (UNIX seconds) and returns its corresponding partition
 */
export function v2_getPartition(blockTimestamp: `0x${string}`) {
	const date = new Date(hexToNumber(blockTimestamp) * 1000);
	const year = date.getFullYear().toString();
	const month = date.getMonth().toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	return Number.parseInt(`${year}${month}${day}`);
}

/**
 * Accepts a list of event ids and returns a list of SQL WHERE clauses for each unique partition
 */
export function v2_getPartitions(ids: string[]) {
	const partitions = Object.groupBy(ids, (id) => {
		return v2_getPartition(numberToHex(v2_parseId(id).blockTimestamp));
	});

	return Object.entries(partitions).flatMap(([partition, ids]) => {
		if (ids === undefined) {
			return [];
		}

		if (ids.length === 0) {
			return [];
		}

		const mapped = ids.map((id) => `unhex('${id}')`);

		return `(partition = ${partition} AND id IN (${mapped.join(",")}))`;
	});
}

export function parseId(id: string) {
	const block_timestamp = Number.parseInt(id.slice(0, 8), 16);
	const block_number = Number.parseInt(id.slice(9, 18).split("-").join(""), 16);
	const tx_index = Number.parseInt(id.slice(19, 23), 16);
	const log_index = Number.parseInt(id.slice(24, 28), 16);
	const chain_id = getExternalChain(Number.parseInt(id.slice(28, 32), 16));
	const table_id = Number.parseInt(id.slice(32, 36), 16);
	return { block_timestamp, block_number, tx_index, log_index, chain_id, table_id };
}

export function v2_parseId(id: string) {
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
			const timestamp = _b.block_timestamp - _a.block_timestamp;
			if (timestamp !== 0) return timestamp;

			// Compare block number
			const block = _b.block_number - _a.block_number;
			if (block !== 0) return block;

			// Compare tx index if from same block
			const tx = _b.tx_index - _a.tx_index;
			if (tx !== 0) return tx;

			// Compare log index if from same transaction
			const log = _b.log_index - _a.log_index;
			if (log !== 0) return log;

			return 0; // Can't order between these two events
		});
	}

	return events.sort((a, b) => {
		const _a = parseId(a.id);
		const _b = parseId(b.id);

		// Compare timestamp first
		const timestamp = _a.block_timestamp - _b.block_timestamp;
		if (timestamp !== 0) return timestamp;

		// Compare block number
		const block = _a.block_number - _b.block_number;
		if (block !== 0) return block;

		// Compare tx index if from same block
		const tx = _a.tx_index - _b.tx_index;
		if (tx !== 0) return tx;

		// Compare log index if from same transaction
		const log = _a.log_index - _b.log_index;
		if (log !== 0) return log;

		return 0; // Can't order between these two events
	});
}

export function formatTokenAmount(quantity: string, decimals: number) {
	const number = parseStringInt(quantity, decimals);
	if (decimals > quantity.length) return formatNumber(number, { maximumSignificantDigits: 2 });
	return formatNumber(number, { maximumFractionDigits: 2 });
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
		inverted_chains[internal_chain as keyof typeof inverted_chains] ||
		raise(`Unknown internal chain id ${internal_chain}`)
	);
}

export function isMobile() {
	return window.innerWidth < 768;
}

export function isDesktop() {
	return window.innerWidth >= 768;
}
