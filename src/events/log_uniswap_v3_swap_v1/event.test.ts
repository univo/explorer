import { test } from "vitest";

import { event } from "./event";
import { test_getBlock } from "@/tests/utils";

test.concurrent("log_uniswap_v3_swap_v1 decodes swap logs", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 12369879 });

	expect(event.handler(block)).toMatchInlineSnapshot(`
		[
		  {
		    "amount_0": -33854155678824490173n,
		    "amount_1": 10000000000000000n,
		    "id": "6091acbb00bcbfd7002800005b00010029",
		    "liquidity": 80059851033970806503n,
		    "pool_address": "0xC2e9F25Be6257c210d7Adf0D4Cd6E3E881ba25f8",
		    "recipient_address": "0x3b8ccaa89FcD432f1334D35b10fF8547001Ce3e5",
		    "sender_address": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
		    "sqrt_price_x96": 1364573512386034424627810688n,
		    "tick": -81234,
		  },
		]
	`);
});
