import { numberToHex } from "viem";

import type { Id } from "@/events";
import { REVERSE_TABLES, TABLES } from "@/constants";
import { getExternalChain, getInternalChain } from "@/helpers";

export function serializeCursor(opts: Id) {
	const _blockTimestamp = numberToHex(Math.floor(opts.block_timestamp.getTime() / 1000));
	const _blockNumber = numberToHex(opts.block_number);
	const _txIndex = numberToHex(opts.tx_index);
	const _logIndex = numberToHex(opts.log_index);
	const _chainId = numberToHex(opts.chain);
	const _tableId = TABLES[opts.tag];

	const blockTimestamp = _blockTimestamp.slice(2).padStart(8, "0");
	const blockNumber = _blockNumber.slice(2).padStart(8, "0");
	const txIndex = _txIndex.slice(2).padStart(4, "0");
	const logIndex = _logIndex.slice(2).padStart(6, "0");
	const chainId = getInternalChain(_chainId).toString(16).padStart(4, "0");
	const tableId = _tableId.toString(16).padStart(4, "0");

	return `${blockTimestamp}${blockNumber}${txIndex}${logIndex}${chainId}${tableId}`;
}

export function deserializeCursor(string: string) {
	const blockTimestamp = Number.parseInt(string.slice(0, 8), 16);
	const blockNumber = Number.parseInt(string.slice(8, 16), 16);
	const txIndex = Number.parseInt(string.slice(16, 20), 16);
	const logIndex = Number.parseInt(string.slice(20, 26), 16);
	const chainId = getExternalChain(Number.parseInt(string.slice(26, 30), 16));
	const tableId = Number.parseInt(string.slice(30, 34), 16);

	const id: Id = {
		block_timestamp: new Date(blockTimestamp * 1000),
		block_number: blockNumber,
		tx_index: txIndex,
		log_index: logIndex,
		chain: chainId,
		tag: REVERSE_TABLES[tableId],
	};

	return id;
}
