import { test } from "vitest";

import { event, getIntentIdmV2 } from "./event";
import { test_getBlock, test_client } from "@/tests/utils";

test.concurrent("intent_idm_v2 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 23483288 });

	const handled = event.handler(block);

	await event.storage.delete(handled);

	const initial = await getIntentIdmV2(handled);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_idm_v2", //
					"intent_idm_v2_index_account_v4",
					"intent_idm_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const stored = await getIntentIdmV2(handled);

	expect(stored).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 23483288,
		    "block_timestamp": 2025-10-01T13:36:23.000Z,
		    "chain": 1,
		    "from_address": "0x878761636a1Dd513463B04A66413C77E8B4eEDEd",
		    "log_index": 16777215,
		    "message": "Blockchain Verified Certificate of Purity for So Pure Supplements XParasite. Batch Code: A5F37E33CB45 Certifying authority: Blockchain Institute of Technology. https://verify.blockchaininstitute.com/ipfs/bafybeigiy6z3mg255bee7wf3pzdekcdqnvj37u55m5agdtrutn7mkuicyq",
		    "success": true,
		    "tag": "intent_idm_v2",
		    "to_address": "0xEc84F0B4d6FaCF98185bA4889CeD612e25D02483",
		    "tx_index": 21,
		  },
		]
	`);
});
