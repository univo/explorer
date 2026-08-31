import { test } from "vitest";

import { event, getIntentFwaAcquireV1 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_fwa_acquire_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25873188 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getIntentFwaAcquireV1(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_fwa_acquire_v1", //
					"intent_fwa_acquire_v1_index_account_v3",
					"intent_fwa_acquire_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getIntentFwaAcquireV1(ids);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "acquisition_count": "0x02",
		    "id": "6a9511cf018acb24005affffff00010033",
		    "purchaser_address": "0xFdA2Ef0876F237C99f30F60Ed99d376cd563A430",
		    "submitted_eth": "0x0229c7625ce650e4",
		    "success": true,
		    "tag": "intent_fwa_acquire_v1",
		  },
		]
	`);
});
