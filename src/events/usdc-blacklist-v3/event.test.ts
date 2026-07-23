import { test } from "vitest";

import { event, getUsdcBlacklistV3 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("usdc_blacklist_v3", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25497404 });

	await event.storage.delete(event.handler(block));

	const ids = event.handler(block).map((event) => event.id);
	const initial = await getUsdcBlacklistV3(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"usdc_blacklist_v3",
					"usdc_blacklist_v3_index_account_v3",
					"usdc_blacklist_v3_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const events = await getUsdcBlacklistV3(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "account_address": "0x3E140E2Db21D0AEC7fde9f0E134c02C5321f0Cd3",
		    "id": "6a5003e301850f3c002300006000010013",
		    "success": true,
		    "tag": "usdc_blacklist_v3",
		  },
		]
	`);
});
