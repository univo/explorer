import { http } from "univo/transport";

import type { Event } from "./events";
import type { Chain } from "./constants";
import { hexToNumber, raise } from "./utils";
import { CHAINS, EXPLORERS, REVERSE_CHAINS, TABLES } from "./constants";

export const ethereum = http(process.env.ETHEREUM_URL);

export const arbitrum = http(process.env.ARBITRUM_URL);

export function getExplorerUrl(chain: Chain, path: `/${string}`) {
	return `${EXPLORERS[chain]}${path}`;
}

export function getNode(chain: Chain | `0x${string}`) {
	const chainId = typeof chain === "string" ? hexToNumber(chain) : chain;

	switch (chainId) {
		case 1:
			return ethereum;
		case 42161:
			return arbitrum;
		default:
			return raise(`Unsupported chain id ${chainId}`);
	}
}

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

			const chain = b.chain - a.chain;
			if (chain !== 0) return chain;

			return TABLES[b.tag] - TABLES[a.tag];
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

		const chain = a.chain - b.chain;
		if (chain !== 0) return chain;

		return TABLES[a.tag] - TABLES[b.tag];
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
