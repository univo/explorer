import { test } from "vitest";

import { event } from "./event";
import { test_getBlock } from "@/tests/utils";

test.concurrent("log_uniswap_v3_pool_created_v1 decodes pool creation logs", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 12369760 });

	expect(event.handler(block)).toMatchInlineSnapshot(`
		[
		  {
		    "fee": "0x1f4",
		    "id": "6091a75500bcbf60005200005000010028",
		    "pool_address": "0x6c6Bc977E13Df9b0de53b251522280BB72383700",
		    "tick_spacing": "0xa",
		    "token_0_address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
		    "token_1_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		  },
		]
	`);
});
