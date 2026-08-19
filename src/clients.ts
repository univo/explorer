import { mainnet } from "viem/chains";
import { http, createPublicClient } from "viem";

import type { Chain } from "./constants";

// TODO: Create a custom transport that implements rate-limiting and deduplication

const clients = {
	1: createPublicClient({
		cacheTime: 0,
		chain: mainnet,
		transport: http(process.env.ETHEREUM_URL, { batch: { batchSize: 1000, wait: 0 } }),
	}),
};

export function getClient(chain: Chain) {
	return clients[chain];
}
