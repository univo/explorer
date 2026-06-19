import { test } from "vitest";

import { getCancelPendingTxV2 } from "./event";
import { test_deleteEvents, test_getBlock, test_v2_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("cancel_pending_tx_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10782880 });

	await test_deleteEvents(block, "event_cancel_pending_tx_v2");

	await test_writeEvents(block, "cancel_pending_tx_v2");

	const ids = await test_v2_getEventIdsForBlock(block, "event_cancel_pending_tx_v2");
	const events = await getCancelPendingTxV2(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "from_address": "0xa574469c959803481f25f825b41f1137BAfcF095",
		    "id": "5f4fc6ee00a488a0001400000001000f",
		    "nonce": 280,
		    "success": true,
		    "tag": "cancel_pending_tx_v2",
		  },
		  {
		    "from_address": "0xD95e3878e7ADd9e87d7CA9866012D69BF391B34E",
		    "id": "5f4fc6ee00a488a0001700000001000f",
		    "nonce": 178,
		    "success": true,
		    "tag": "cancel_pending_tx_v2",
		  },
		  {
		    "from_address": "0x56b217cc582e19B3ca933Fd411E85ca7DeF68445",
		    "id": "5f4fc6ee00a488a0002600000001000f",
		    "nonce": 8407,
		    "success": true,
		    "tag": "cancel_pending_tx_v2",
		  },
		  {
		    "from_address": "0x1848F4BCeF9eeb9aa4CBC3F773Ce4E8150112519",
		    "id": "5f4fc6ee00a488a0004b00000001000f",
		    "nonce": 2888,
		    "success": true,
		    "tag": "cancel_pending_tx_v2",
		  },
		  {
		    "from_address": "0xD5c58B0D819be34b7b8Ff69E76e6A4b5fB912263",
		    "id": "5f4fc6ee00a488a0007300000001000f",
		    "nonce": 66,
		    "success": true,
		    "tag": "cancel_pending_tx_v2",
		  },
		]
	`);
});
