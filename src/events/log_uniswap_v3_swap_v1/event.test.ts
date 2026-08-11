import { test } from "vitest";

import { event, getLogUniswapV3SwapV1 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("log_uniswap_v3_swap_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 12369879 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getLogUniswapV3SwapV1(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"log_uniswap_v3_swap_v1", //
					"log_uniswap_v3_swap_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getLogUniswapV3SwapV1(ids);

	expect(final).toMatchInlineSnapshot(`
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
		    "success": true,
		    "tag": "log_uniswap_v3_swap_v1",
		    "tick": -81234,
		  },
		]
	`);
});
