import { test } from "vitest";

import { getEnsNameRegisteredV1 } from "./event";
import { test_deleteEvents, test_getBlock, test_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("ens_name_registered_v1", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 23643423 });

	await test_deleteEvents(block, "event_ens_name_registered_v1");

	const response = await test_writeEvents(block, "ens_name_registered_v1");

	expect(response.error).toBeUndefined();
	expect(response.result).toMatchObject({ failures: [] });

	const ids = await test_getEventIdsForBlock(block, "event_ens_name_registered_v1");

	const events = await getEnsNameRegisteredV1(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "cost_eth": "1296836786995761",
		    "expires_at": 1792758035000,
		    "id": "68fab843-0168-c51f-008a-016100010005",
		    "name": "hangytong",
		    "owner_address": "0xeFb564F5623978F68ff3546b0769ed564A9058EC",
		    "success": true,
		    "tag": "ens_name_registered_v1",
		  },
		]
	`);
});

test.concurrent("ens_name_registered_v1", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 18732525 });

	await test_deleteEvents(block, "event_ens_name_registered_v1");

	const response = await test_writeEvents(block, "ens_name_registered_v1");

	expect(response.error).toBeUndefined();
	expect(response.result).toMatchObject({ failures: [] });

	const ids = await test_getEventIdsForBlock(block, "event_ens_name_registered_v1");

	const events = await getEnsNameRegisteredV1(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "cost_eth": "2207156037776686",
		    "expires_at": 1733425619000,
		    "id": "65716103-011d-d5ed-009c-017b00010005",
		    "name": "payblock",
		    "owner_address": "0xFA929Fc3e365050e539360fb4D4BF971DCf28EdA",
		    "success": true,
		    "tag": "ens_name_registered_v1",
		  },
		]
	`);
});
