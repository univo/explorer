import { test } from "vitest";

import { getCancelPendingTxV2 } from "./event";
import { test_deleteEvents, test_getBlock, test_v2_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("cancel_pending_tx_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10782880 });

	await test_deleteEvents(block, "event_cancel_pending_tx_v2");

	await test_writeEvents(block, "cancel_pending_tx_v2");

	const ids = await test_v2_getEventIdsForBlock(block, "event_cancel_pending_tx_v2");
	const events = await getCancelPendingTxV2(ids);

	expect(events).toHaveLength(5);
	expect(events).toEqual(
		expect.arrayContaining([
			{
				from_address: "0xa574469c959803481f25f825b41f1137bafcf095",
				id: "5f4fc6ee00a488a0001400000001000f",
				nonce: 280,
				success: true,
				tag: "cancel_pending_tx_v2",
			},
			{
				from_address: "0xd5c58b0d819be34b7b8ff69e76e6a4b5fb912263",
				id: "5f4fc6ee00a488a0007300000001000f",
				nonce: 66,
				success: true,
				tag: "cancel_pending_tx_v2",
			},
		]),
	);
});
