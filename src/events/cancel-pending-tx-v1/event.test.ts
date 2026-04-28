import { test } from "vitest";

import { getCancelPendingTxV1 } from "./event";
import { test_deleteEvents, test_getBlock, test_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("cancel_pending_tx_v1", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10782880 });

	await test_deleteEvents(block, "event_cancel_pending_tx_v1");

	const response = await test_writeEvents(block, "cancel_pending_tx_v1");

	expect(response.error).toBeUndefined();
	expect(response.result).toMatchObject({ failures: [] });

	const ids = await test_getEventIdsForBlock(block, "event_cancel_pending_tx_v1");

	const events = await getCancelPendingTxV1(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "from_address": "0xa574469c959803481f25f825b41f1137BAfcF095",
		    "id": "5f4fc6ee-00a4-88a0-0014-000000010006",
		    "nonce": 280,
		    "success": true,
		    "tag": "cancel_pending_tx_v1",
		  },
		  {
		    "from_address": "0xD95e3878e7ADd9e87d7CA9866012D69BF391B34E",
		    "id": "5f4fc6ee-00a4-88a0-0017-000000010006",
		    "nonce": 178,
		    "success": true,
		    "tag": "cancel_pending_tx_v1",
		  },
		  {
		    "from_address": "0x56b217cc582e19B3ca933Fd411E85ca7DeF68445",
		    "id": "5f4fc6ee-00a4-88a0-0026-000000010006",
		    "nonce": 8407,
		    "success": true,
		    "tag": "cancel_pending_tx_v1",
		  },
		  {
		    "from_address": "0x1848F4BCeF9eeb9aa4CBC3F773Ce4E8150112519",
		    "id": "5f4fc6ee-00a4-88a0-004b-000000010006",
		    "nonce": 2888,
		    "success": true,
		    "tag": "cancel_pending_tx_v1",
		  },
		  {
		    "from_address": "0xD5c58B0D819be34b7b8Ff69E76e6A4b5fB912263",
		    "id": "5f4fc6ee-00a4-88a0-0073-000000010006",
		    "nonce": 66,
		    "success": true,
		    "tag": "cancel_pending_tx_v1",
		  },
		]
	`);
});
