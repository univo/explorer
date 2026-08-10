import { test } from "vitest";

import { event, getIntentCancelPendingTxV1 } from "./event";
import { test_getBlock, test_client } from "@/tests/utils";

// Example 0xfa14e402325f30b24add5d897cb801d31486669f6d48f14348b6844955946a03

test.concurrent("intent_cancel_pending_tx_v1", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10782880 });

	await event.storage.delete(event.handler(block));

	const ids = event.handler(block).map((event) => event.id);

	const initial = await getIntentCancelPendingTxV1(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_cancel_pending_tx_v1",
					"intent_cancel_pending_tx_v1_index_account_v3",
					"intent_cancel_pending_tx_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const events = await getIntentCancelPendingTxV1(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "from_address": "0xa574469c959803481f25f825b41f1137BAfcF095",
		    "id": "5f4fc6ee00a488a00014ffffff0001000f",
		    "nonce": "0x0118",
		    "success": true,
		    "tag": "intent_cancel_pending_tx_v1",
		  },
		  {
		    "from_address": "0xD95e3878e7ADd9e87d7CA9866012D69BF391B34E",
		    "id": "5f4fc6ee00a488a00017ffffff0001000f",
		    "nonce": "0xb2",
		    "success": true,
		    "tag": "intent_cancel_pending_tx_v1",
		  },
		  {
		    "from_address": "0x56b217cc582e19B3ca933Fd411E85ca7DeF68445",
		    "id": "5f4fc6ee00a488a00026ffffff0001000f",
		    "nonce": "0x20d7",
		    "success": true,
		    "tag": "intent_cancel_pending_tx_v1",
		  },
		  {
		    "from_address": "0x1848F4BCeF9eeb9aa4CBC3F773Ce4E8150112519",
		    "id": "5f4fc6ee00a488a0004bffffff0001000f",
		    "nonce": "0x0b48",
		    "success": true,
		    "tag": "intent_cancel_pending_tx_v1",
		  },
		  {
		    "from_address": "0xD5c58B0D819be34b7b8Ff69E76e6A4b5fB912263",
		    "id": "5f4fc6ee00a488a00073ffffff0001000f",
		    "nonce": "0x42",
		    "success": true,
		    "tag": "intent_cancel_pending_tx_v1",
		  },
		]
	`);
});
