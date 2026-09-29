import { test } from "vitest";

import { event, getIntentCancelPendingTxV2 } from "./event";
import { test_getBlock, test_client } from "@/tests/utils";

// Example 0xfa14e402325f30b24add5d897cb801d31486669f6d48f14348b6844955946a03

test.concurrent("intent_cancel_pending_tx_v2 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10782880 });

	const handled = event.handler(block);

	await event.storage.delete(handled);

	const initial = await getIntentCancelPendingTxV2(handled);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_cancel_pending_tx_v2",
					"intent_cancel_pending_tx_v2_index_account_v4",
					"intent_cancel_pending_tx_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const events = await getIntentCancelPendingTxV2(handled);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 10782880,
		    "block_timestamp": 2020-09-02T16:23:10.000Z,
		    "chain": 1,
		    "from_address": "0xa574469c959803481f25f825b41f1137BAfcF095",
		    "log_index": 16777215,
		    "nonce": "0x0118",
		    "success": true,
		    "tag": "intent_cancel_pending_tx_v2",
		    "tx_index": 20,
		  },
		  {
		    "block_number": 10782880,
		    "block_timestamp": 2020-09-02T16:23:10.000Z,
		    "chain": 1,
		    "from_address": "0xD95e3878e7ADd9e87d7CA9866012D69BF391B34E",
		    "log_index": 16777215,
		    "nonce": "0xb2",
		    "success": true,
		    "tag": "intent_cancel_pending_tx_v2",
		    "tx_index": 23,
		  },
		  {
		    "block_number": 10782880,
		    "block_timestamp": 2020-09-02T16:23:10.000Z,
		    "chain": 1,
		    "from_address": "0x56b217cc582e19B3ca933Fd411E85ca7DeF68445",
		    "log_index": 16777215,
		    "nonce": "0x20d7",
		    "success": true,
		    "tag": "intent_cancel_pending_tx_v2",
		    "tx_index": 38,
		  },
		  {
		    "block_number": 10782880,
		    "block_timestamp": 2020-09-02T16:23:10.000Z,
		    "chain": 1,
		    "from_address": "0x1848F4BCeF9eeb9aa4CBC3F773Ce4E8150112519",
		    "log_index": 16777215,
		    "nonce": "0x0b48",
		    "success": true,
		    "tag": "intent_cancel_pending_tx_v2",
		    "tx_index": 75,
		  },
		  {
		    "block_number": 10782880,
		    "block_timestamp": 2020-09-02T16:23:10.000Z,
		    "chain": 1,
		    "from_address": "0xD5c58B0D819be34b7b8Ff69E76e6A4b5fB912263",
		    "log_index": 16777215,
		    "nonce": "0x42",
		    "success": true,
		    "tag": "intent_cancel_pending_tx_v2",
		    "tx_index": 115,
		  },
		]
	`);
});
