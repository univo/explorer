import { test } from "vitest";

import { event } from "./event";
import { test_getBlock } from "@/tests/utils";

test.concurrent("log_uniswap_v3_swap_v1 decodes swap logs", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 12369879 });

	expect(event.handler(block)).toMatchInlineSnapshot(`
		[
		  {
		    "amount_0": "0xfffffffffffffffffffffffffffffffffffffffffffffffe2a2de0c6f0e49b43",
		    "amount_1": "0x000000000000000000000000000000000000000000000000002386f26fc10000",
		    "id": "6091acbb00bcbfd7002800005b00010029",
		    "liquidity": "0x4570dba5712850ee7",
		    "pool_address": "0xC2e9F25Be6257c210d7Adf0D4Cd6E3E881ba25f8",
		    "recipient_address": "0x3b8ccaa89FcD432f1334D35b10fF8547001Ce3e5",
		    "sender_address": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
		    "sqrt_price_x96": "0x468bfae550eb59377235180",
		    "tick": "0xfec2ae",
		  },
		]
	`);
});
