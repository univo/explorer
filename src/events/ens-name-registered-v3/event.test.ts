import { test } from "vitest";

import { event, getEnsNameRegisteredV3 } from "./event";
import { test_getBlock, test_client } from "@/tests/utils";

test.concurrent("ens_name_registered_v3", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 23643423 });

	if (event.storage.delete) {
		await event.storage.delete(event.handler(block));
	}

	const ids = event.handler(block).map((event) => event.id);

	const initial = await getEnsNameRegisteredV3(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [{ events: ["ens_name_registered_v3"], blocks: [block] }],
	});

	const events = await getEnsNameRegisteredV3(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "cost_eth": "0x049b7758054231",
		    "expires_at": "0x6adbebc3",
		    "id": "68fab8430168c51f008a01610001000e",
		    "name": "hangytong",
		    "owner_address": "0xeFb564F5623978F68ff3546b0769ed564A9058EC",
		    "success": true,
		    "tag": "ens_name_registered_v3",
		  },
		]
	`);
});

test.concurrent("ens_name_registered_v3", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 18732525 });

	if (event.storage.delete) {
		await event.storage.delete(event.handler(block));
	}

	const ids = event.handler(block).map((event) => event.id);

	await test_client.request({
		method: "private_writeEvents",
		params: [{ events: ["ens_name_registered_v3"], blocks: [block] }],
	});

	const events = await getEnsNameRegisteredV3(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "cost_eth": "0x07d7658f98752e",
		    "expires_at": "0x67529483",
		    "id": "65716103011dd5ed009c017b0001000e",
		    "name": "payblock",
		    "owner_address": "0xFA929Fc3e365050e539360fb4D4BF971DCf28EdA",
		    "success": true,
		    "tag": "ens_name_registered_v3",
		  },
		]
	`);
});
