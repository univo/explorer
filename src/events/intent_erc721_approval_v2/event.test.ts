import { test } from "vitest";

import { event, getIntentErc721ApprovalV2 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_erc721_approval_v2 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25798547 });

	const handled = event.handler(block);

	expect(handled).toHaveLength(1);

	await event.storage.delete(handled);

	const ids = handled.map((event) => event.id);

	expect(await getIntentErc721ApprovalV2(ids)).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_erc721_approval_v2", //
					"intent_erc721_approval_v2_index_account_v4",
					"intent_erc721_approval_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const stored = await getIntentErc721ApprovalV2(ids);

	expect(stored).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 25798547,
		    "block_timestamp": 2026-08-20T19:52:47.000Z,
		    "caller_address": "0x6668A6c1309075eB513b6C555BE95E8679d875b9",
		    "chain": 1,
		    "id": "6a875b0f0189a7930063ffffff00010048",
		    "log_index": 16777215,
		    "spender_address": "0x46dB2976C1E46dDdDCB4e5D990de337353007a69",
		    "success": true,
		    "tag": "intent_erc721_approval_v2",
		    "token_address": "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
		    "token_id": "0x14a814",
		    "tx_index": 99,
		  },
		]
	`);
});
