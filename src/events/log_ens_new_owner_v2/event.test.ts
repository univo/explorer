import { test } from "vitest";

import { test_client, test_getBlock } from "@/tests/utils";
import { event, getEnsExistsForAccounts, getLogEnsNewOwnerV2 } from "./event";

test.concurrent("log_ens_new_owner_v2 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 8835278 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getLogEnsNewOwnerV2(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"log_ens_new_owner_v2", //
					"log_ens_new_owner_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const stored = await getLogEnsNewOwnerV2(ids);

	expect(stored).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 8835278,
		    "block_timestamp": 2019-10-29T17:23:20.000Z,
		    "chain": 1,
		    "id": "5db875880086d0ce00d30000e90001003b",
		    "label": "0x535bdae9bb214b3cc583b53384464999f2f7f48625f160728c63e73e766ff71e",
		    "log_index": 233,
		    "owner_address": "0x9062C0A6Dbd6108336BcBe4593a3D1cE05512069",
		    "tag": "log_ens_new_owner_v2",
		    "tx_index": 211,
		  },
		]
	`);

	const eligibility = await getEnsExistsForAccounts([
		{ chain: 1, address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
		{ chain: 1, address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
		{ chain: 1, address: "0x0000000000000000000000000000000000000000" },
	]);

	expect(eligibility).toStrictEqual([true, true, false]);
});
