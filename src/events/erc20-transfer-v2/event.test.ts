import { test } from "vitest";

import { getErc20TransferV2 } from "./event";
import { test_deleteEvents, test_getBlock, test_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("erc20_transfer_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10000000 });

	await test_deleteEvents(block, "event_erc20_transfer_v2");

	const response = await test_writeEvents(block, "erc20_transfer_v2");

	expect(response.error).toBeUndefined();
	expect(response.result).toMatchObject({ failures: [] });

	const ids = await test_getEventIdsForBlock(block, "event_erc20_transfer_v2");

	const events = await getErc20TransferV2(ids);

	expect(events).toMatchInlineSnapshot();
});
