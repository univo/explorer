import { test } from "vitest";

import { event, getEnsNameRegisteredV2 } from "./event";
import { test_getBlock, test_v2_getEventIdsForBlock, test_client } from "@/tests/utils";

test.concurrent("ens_name_registered_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 23643423 });

	if (event.storage.delete) {
		await event.storage.delete(event.handler(block));
	}

	await test_client.request({
		method: "private_writeEvents",
		params: [{ events: ["ens_name_registered_v2"], blocks: [block] }],
	});

	const ids = await test_v2_getEventIdsForBlock(block, "event_ens_name_registered_v2");

	const events = await getEnsNameRegisteredV2(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "cost_eth": "1296836786995761",
		    "expires_at": 1792797635000,
		    "id": "68fab8430168c51f008a01610001000e",
		    "name": "hangytong",
		    "owner_address": "0xeFb564F5623978F68ff3546b0769ed564A9058EC",
		    "success": true,
		    "tag": "ens_name_registered_v2",
		  },
		]
	`);
});

test.concurrent("ens_name_registered_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 18732525 });

	if (event.storage.delete) {
		await event.storage.delete(event.handler(block));
	}

	await test_client.request({
		method: "private_writeEvents",
		params: [{ events: ["ens_name_registered_v2"], blocks: [block] }],
	});

	const ids = await test_v2_getEventIdsForBlock(block, "event_ens_name_registered_v2");
	const events = await getEnsNameRegisteredV2(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "cost_eth": "2207156037776686",
		    "expires_at": 1733465219000,
		    "id": "65716103011dd5ed009c017b0001000e",
		    "name": "payblock",
		    "owner_address": "0xFA929Fc3e365050e539360fb4D4BF971DCf28EdA",
		    "success": true,
		    "tag": "ens_name_registered_v2",
		  },
		]
	`);
});
