import { test } from "vitest";

import { test_client, test_getBlock } from "@/tests/utils";
import { event, getLogEnsNameForAddrChangedV2 } from "./event";

test.concurrent("log_ens_name_for_addr_changed_v2 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25774800 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getLogEnsNameForAddrChangedV2(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"log_ens_name_for_addr_changed_v2", //
					"log_ens_name_for_addr_changed_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const stored = await getLogEnsNameForAddrChangedV2(ids);

	expect(stored).toMatchInlineSnapshot(`
		[
		  {
		    "account_address": "0x8D56AeBB8321c6964943DfA056Bbd7261fEc9214",
		    "block_number": 25774800,
		    "block_timestamp": 2026-08-17T12:27:47.000Z,
		    "chain": 1,
		    "id": "6a82fe4301894ad001540004260001003a",
		    "log_index": 1062,
		    "name": "etherscanofficial.eth",
		    "tag": "log_ens_name_for_addr_changed_v2",
		    "tx_index": 340,
		  },
		]
	`);
});
