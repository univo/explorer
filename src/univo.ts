import { defineIndexer } from "univo";
import { http } from "univo/transport";
import { env } from "cloudflare:workers";
import { defineStorage } from "univo/metadata";
import { r2 } from "univo/metadata/adapters/r2-binding";

import { action as invalidate_ens_cache } from "./actions/invalidate_ens_cache";

import { event as log_ens_name_for_addr_changed_v2 } from "./events/log_ens_name_for_addr_changed_v2/event";

const node = http(process.env.ETHEREUM_URL);

export const univo = defineIndexer({
	quiet: false,

	metadataStorage: defineStorage({
		adapter: r2({
			binding: env.BUCKET,
		}),
	}),

	getBlock: async (head) => {
		const [eth_getBlockByNumber, eth_getBlockReceipts] = await Promise.all([
			node.request({ method: "eth_getBlockByNumber", params: [head.number, true] }),
			node.request({ method: "eth_getBlockReceipts", params: [head.number] }),
		]);

		return {
			eth_chainId: head.chain,
			eth_getBlockByNumber,
			eth_getBlockReceipts,
		};
	},

	actions: [
		invalidate_ens_cache, //
	],

	events: [
		log_ens_name_for_addr_changed_v2, //
	],
});
