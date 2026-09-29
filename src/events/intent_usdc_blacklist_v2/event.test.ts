import { test } from "vitest";

import { event, getIntentUsdcBlacklistV2 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_usdc_blacklist_v2 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25497404 });

	const handled = event.handler(block);

	await event.storage.delete(handled);

	const initial = await getIntentUsdcBlacklistV2(handled);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_usdc_blacklist_v2",
					"intent_usdc_blacklist_v2_index_account_v4",
					"intent_usdc_blacklist_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const events = await getIntentUsdcBlacklistV2(handled);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "account_address": "0x3E140E2Db21D0AEC7fde9f0E134c02C5321f0Cd3",
		    "block_number": 25497404,
		    "block_timestamp": 2026-07-09T20:26:11.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "success": true,
		    "tag": "intent_usdc_blacklist_v2",
		    "tx_index": 35,
		  },
		]
	`);
});
