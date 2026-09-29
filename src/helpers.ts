import type { RpcTransactionReceipt } from "viem";

import type { EventId } from "./events";
import { hexToNumber, raise } from "./utils";
import { CHAINS, REVERSE_CHAINS } from "./constants";

export function getEventSuccess(receipt: RpcTransactionReceipt | undefined) {
	if (receipt === undefined) {
		throw new Error("No receipt");
	}

	// Correctly the types suggest that `status` is always available on the receipt. This is only true for
	// blocks after the Byzantium upgrade in 2017 at block 4,370,000.

	// We have to use the `in` syntax here to prevent univo returning an 'incomplete_error'. This occurs
	// because we attempt to read a property on an object that doesn't exist. Which the impl detail of univo
	// uses to determine if new properties of the block are being accessed during historical indexes.

	if ("status" in receipt) {
		return receipt.status === "0x1";
	}

	// At the moment we default to this being true. This could be misleading for events before the upgrade if
	// they actually did fail (there might be a different way to detect this?). The reasoning is that data
	// this old is less important to be equally as accurate as fresher data.

	return true;
}

export function getOrderedEvents(events: EventId[], order: "latest" | "reverse") {
	if (order === "latest") {
		return events.sort((a, b) => {
			// Compare timestamp first
			const timestamp = b.block_timestamp.getTime() - a.block_timestamp.getTime();
			if (timestamp !== 0) return timestamp;

			// Compare block number
			const block = b.block_number - a.block_number;
			if (block !== 0) return block;

			// Compare tx index if from same block
			const tx = b.tx_index - a.tx_index;
			if (tx !== 0) return tx;

			// Compare log index if from same transaction
			const log = b.log_index - a.log_index;
			if (log !== 0) return log;

			return 0; // Can't order between these two events
		});
	}

	return events.sort((a, b) => {
		// Compare timestamp first
		const timestamp = a.block_timestamp.getTime() - b.block_timestamp.getTime();
		if (timestamp !== 0) return timestamp;

		// Compare block number
		const block = a.block_number - b.block_number;
		if (block !== 0) return block;

		// Compare tx index if from same block
		const tx = a.tx_index - b.tx_index;
		if (tx !== 0) return tx;

		// Compare log index if from same transaction
		const log = a.log_index - b.log_index;
		if (log !== 0) return log;

		return 0; // Can't order between these two events
	});
}

/**
 * getInternalChain
 * Maps an external chain id to an internal chain identifier
 *
 * @param external_chain External chain identifier
 * @returns Internal chain identifier for the provided chain
 */
export function getInternalChain(external_chain: `0x${string}` | keyof typeof CHAINS) {
	if (typeof external_chain === "string") {
		return (
			CHAINS[hexToNumber(external_chain) as keyof typeof CHAINS] || //
			raise(`Unsupported chain id ${hexToNumber(external_chain)}`)
		);
	}

	return CHAINS[external_chain];
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
		(REVERSE_CHAINS[internal_chain as keyof typeof REVERSE_CHAINS] as keyof typeof CHAINS) ||
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

	if (!res.ok || res.status < 200 || res.status >= 300) {
		throw new Error("Failed to get response from ETHEREUM_URL");
	}

	const json: any = await res.json().catch((cause) => {
		throw new Error("Unable to parse json response", { cause });
	});

	if (json.error) {
		throw new Error(json.error.message);
	}

	return json.result;
}
