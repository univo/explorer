import { test } from "vitest";

import { test_client, test_getBlock } from "@/tests/utils";
import { event, getLogEnsNameForAddrChangedV1 } from "./event";

test.concurrent("log_ens_name_for_addr_changed_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25774800 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getLogEnsNameForAddrChangedV1(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"log_ens_name_for_addr_changed_v1", //
					"log_ens_name_for_addr_changed_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const stored = await getLogEnsNameForAddrChangedV1(ids);

	expect(stored).toMatchInlineSnapshot(`
		[
		  {
		    "account_address": "0x8D56AeBB8321c6964943DfA056Bbd7261fEc9214",
		    "id": "6a82fe4301894ad001540004260001002b",
		    "name": "etherscanofficial.eth",
		    "success": true,
		    "tag": "log_ens_name_for_addr_changed_v1",
		  },
		]
	`);
});
