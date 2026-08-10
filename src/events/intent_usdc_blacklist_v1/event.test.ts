import { test } from "vitest";

import { event, getIntentUsdcBlacklistV1 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_usdc_blacklist_v1", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25497404 });

	await event.storage.delete(event.handler(block));

	const ids = event.handler(block).map((event) => event.id);

	const initial = await getIntentUsdcBlacklistV1(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_usdc_blacklist_v1",
					"intent_usdc_blacklist_v1_index_account_v3",
					"intent_usdc_blacklist_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const events = await getIntentUsdcBlacklistV1(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "account_address": "0x3E140E2Db21D0AEC7fde9f0E134c02C5321f0Cd3",
		    "id": "6a5003e301850f3c0023ffffff00010021",
		    "success": true,
		    "tag": "intent_usdc_blacklist_v1",
		  },
		]
	`);
});
