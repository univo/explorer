import { test } from "vitest";

import { event, getIntentErc20TransferV2 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_erc20_transfer_v2 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10000000 });

	const handled = event.handler(block);

	expect(handled).toHaveLength(40);

	await event.storage.delete(handled);

	const initial = await getIntentErc20TransferV2(handled);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_erc20_transfer_v2", //
					"intent_erc20_transfer_v2_index_account_v4",
					"intent_erc20_transfer_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const stored = await getIntentErc20TransferV2(handled);

	expect(stored).toHaveLength(40);

	expect(stored[0]).toMatchInlineSnapshot(`
		{
		  "block_number": 10000000,
		  "block_timestamp": 2020-05-04T13:22:13.000Z,
		  "chain": 1,
		  "from_address": "0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa",
		  "log_index": 16777215,
		  "quantity": "0x052769477a7d940000",
		  "success": true,
		  "tag": "intent_erc20_transfer_v2",
		  "to_address": "0x566021352EB2f882538BF8D59E5d2BA741b9EC7A",
		  "token_address": "0xCeD4E93198734dDaFf8492d525Bd258D49eb388E",
		  "tx_index": 5,
		}
	`);
});
