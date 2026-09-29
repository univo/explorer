import { test } from "vitest";

import { event, getLogEnsReverseClaimedV2 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("log_ens_reverse_claimed_v2 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25770632 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const initial = await getLogEnsReverseClaimedV2(events);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"log_ens_reverse_claimed_v2", //
					"log_ens_reverse_claimed_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const stored = await getLogEnsReverseClaimedV2(events);

	expect(stored).toMatchInlineSnapshot(`
		[
		  {
		    "account_address": "0x33b86899aFFfDdac63cFB1038370450e69530F70",
		    "block_number": 25770632,
		    "block_timestamp": 2026-08-16T22:31:11.000Z,
		    "chain": 1,
		    "log_index": 753,
		    "node": "0x2eaf481c711aa75ef5f72810e28d92c9fb27e79db947366b8371c69cee4def52",
		    "tag": "log_ens_reverse_claimed_v2",
		    "tx_index": 589,
		  },
		]
	`);
});
