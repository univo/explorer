import { mainnet } from "viem/chains";
import { http, createPublicClient } from "viem";

import type { Chain } from "./constants";

// TODO: Create a custom transport that implements rate-limiting, batching, and deduplication

const clients = {
	1: createPublicClient({
		chain: mainnet,
		transport: http(process.env.ETHEREUM_URL),
	}),
};

export function getClient(chain: Chain) {
	return clients[chain];
}
