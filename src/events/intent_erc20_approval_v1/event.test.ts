import { test } from "vitest";

import { event, getIntentErc20ApprovalV1 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_erc20_approval_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10000000 });

	const handled = event.handler(block);

	expect(handled).toHaveLength(13);

	await event.storage.delete(handled);

	const ids = handled.map((event) => event.id);

	const initial = await getIntentErc20ApprovalV1(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_erc20_approval_v1", //
					"intent_erc20_approval_v1_index_account_v3",
					"intent_erc20_approval_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const stored = await getIntentErc20ApprovalV1(ids);

	expect(stored).toHaveLength(13);

	expect(stored[0]).toMatchInlineSnapshot(`
		{
		  "id": "5eb01705009896800018ffffff0001002e",
		  "owner_address": "0xBCE5FE052B25E422550f6012FDD1941F9353f001",
		  "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		  "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		  "success": true,
		  "tag": "intent_erc20_approval_v1",
		  "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		}
	`);
});
