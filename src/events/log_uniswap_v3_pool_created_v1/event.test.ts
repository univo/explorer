import { test } from "vitest";

import { test_client, test_getBlock } from "@/tests/utils";
import { event, getLogUniswapV3PoolCreatedV1 } from "./event";

test.concurrent("log_uniswap_v3_pool_created_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 12369760 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getLogUniswapV3PoolCreatedV1(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"log_uniswap_v3_pool_created_v1", //
					"log_uniswap_v3_pool_created_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getLogUniswapV3PoolCreatedV1(ids);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "fee": 500,
		    "id": "6091a75500bcbf60005200005000010028",
		    "pool_address": "0x6c6Bc977E13Df9b0de53b251522280BB72383700",
		    "success": true,
		    "tag": "log_uniswap_v3_pool_created_v1",
		    "tick_spacing": 10,
		    "token_0_address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
		    "token_1_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		  },
		]
	`);
});
