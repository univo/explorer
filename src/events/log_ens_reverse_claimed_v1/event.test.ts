import { test } from "vitest";

import { event, getLogEnsReverseClaimedV1 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("log_ens_reverse_claimed_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25770632 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getLogEnsReverseClaimedV1(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"log_ens_reverse_claimed_v1", //
					"log_ens_reverse_claimed_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const stored = await getLogEnsReverseClaimedV1(ids);

	expect(stored).toMatchInlineSnapshot(`
		[
		  {
		    "account_address": "0x33b86899aFFfDdac63cFB1038370450e69530F70",
		    "id": "6a823a2f01893a88024d0002f10001002a",
		    "node": "0x2eaf481c711aa75ef5f72810e28d92c9fb27e79db947366b8371c69cee4def52",
		    "success": true,
		    "tag": "log_ens_reverse_claimed_v1",
		  },
		]
	`);
});
