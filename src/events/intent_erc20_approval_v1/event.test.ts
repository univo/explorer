import { test } from "vitest";

import { event, getIntentErc20ApprovalV1 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_erc20_approval_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10000000 });

	const handled = event.handler(block);

	expect(handled).toHaveLength(2);

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

	expect(stored).toHaveLength(2);

	expect(stored[0]).toMatchInlineSnapshot(`
		{
		  "id": "5eb0170500989680004fffffff0001002e",
		  "owner_address": "0x09e80bdE912794fdbEA1e5B68B0C37A346b73cfC",
		  "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		  "spender_address": "0x882d80D3a191859d64477eb78Cca46599307ec1C",
		  "success": true,
		  "tag": "intent_erc20_approval_v1",
		  "token_address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
		}
	`);
});
