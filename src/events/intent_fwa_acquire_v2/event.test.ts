import { test } from "vitest";
import { numberToHex } from "viem";

import { event, getIntentFwaAcquireV2 } from "./event";
import { univo } from "@/univo";
import { test_getBlock } from "@/tests/utils";

test.concurrent("intent_fwa_acquire_v2 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: "0x1", number: numberToHex(25873188) });

	const events = event.handler(block);

	await event.storage.delete(events);

	const initial = await getIntentFwaAcquireV2(events);

	expect(initial).toStrictEqual([]);

	await univo.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_fwa_acquire_v2", //
					"intent_fwa_acquire_v2_index_account_v4",
					"intent_fwa_acquire_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getIntentFwaAcquireV2(events);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "acquisition_count": "0x02",
		    "block_number": 25873188,
		    "block_timestamp": 2026-08-31T05:31:59.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "purchaser_address": "0xFdA2Ef0876F237C99f30F60Ed99d376cd563A430",
		    "submitted_eth": "0x0229c7625ce650e4",
		    "success": true,
		    "tag": "intent_fwa_acquire_v2",
		    "tx_index": 90,
		  },
		]
	`);
});
