import { test } from "vitest";

import { event, getIntentErc721ApprovalV1 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_erc721_approval_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25798547 });

	const handled = event.handler(block);

	expect(handled).toHaveLength(1);

	await event.storage.delete(handled);

	const ids = handled.map((event) => event.id);

	expect(await getIntentErc721ApprovalV1(ids)).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_erc721_approval_v1", //
					"intent_erc721_approval_v1_index_account_v3",
					"intent_erc721_approval_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const stored = await getIntentErc721ApprovalV1(ids);

	expect(stored).toMatchInlineSnapshot(`
		[
		  {
		    "caller_address": "0x6668A6c1309075eB513b6C555BE95E8679d875b9",
		    "id": "6a875b0f0189a7930063ffffff00010030",
		    "spender_address": "0x46dB2976C1E46dDdDCB4e5D990de337353007a69",
		    "success": true,
		    "tag": "intent_erc721_approval_v1",
		    "token_address": "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
		    "token_id": "0x14a814",
		  },
		]
	`);
});
