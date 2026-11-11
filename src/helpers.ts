import { http } from "univo/transport";

import type { Event } from "./events";
import { hexToNumber, raise } from "./utils";
import { CHAINS, REVERSE_CHAINS } from "./constants";

export const node = http(process.env.ETHEREUM_URL);

export function isMobile() {
	return window.innerWidth < 768;
}

export function isDesktop() {
	return window.innerWidth >= 768;
}

export function getOrderedEvents(events: Event[], order: "latest" | "reverse") {
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
