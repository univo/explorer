import { test } from "vitest";

import { getEnsNameRegisteredV2 } from "./event";
import { test_deleteEvents, test_getBlock, test_v2_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("ens_name_registered_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 23643423 });

	await test_deleteEvents(block, "event_ens_name_registered_v2");

	await test_writeEvents(block, "ens_name_registered_v2");

	const ids = await test_v2_getEventIdsForBlock(block, "event_ens_name_registered_v2");
	const events = await getEnsNameRegisteredV2(ids);

	expect(events).toEqual([
		{
			cost_eth: "1296836786995761",
			expires_at: 1792758035000,
			id: "68fab8430168c51f008a01610001000e",
			name: "hangytong",
			owner_address: "0xefb564f5623978f68ff3546b0769ed564a9058ec",
			success: true,
			tag: "ens_name_registered_v2",
		},
	]);
});

test.concurrent("ens_name_registered_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 18732525 });

	await test_deleteEvents(block, "event_ens_name_registered_v2");

	await test_writeEvents(block, "ens_name_registered_v2");

	const ids = await test_v2_getEventIdsForBlock(block, "event_ens_name_registered_v2");
	const events = await getEnsNameRegisteredV2(ids);

	expect(events).toEqual([
		{
			cost_eth: "2207156037776686",
			expires_at: 1733425619000,
			id: "65716103011dd5ed009c017b0001000e",
			name: "payblock",
			owner_address: "0xfa929fc3e365050e539360fb4d4bf971dcf28eda",
			success: true,
			tag: "ens_name_registered_v2",
		},
	]);
});
