import { test } from "vitest";

import { getInputDataMessageV1 } from "./event";
import { test_deleteEvents, test_getBlock, test_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("input_data_message_v1", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 23483288 });

	await test_deleteEvents(block, "event_input_data_message_v1");

	const response = await test_writeEvents(block, "input_data_message_v1");

	expect(response.error).toBeUndefined();
	expect(response.result).toMatchObject({ failures: [] });

	const ids = await test_getEventIdsForBlock(block, "event_input_data_message_v1");

	const events = await getInputDataMessageV1(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "from_address": "0x878761636a1Dd513463B04A66413C77E8B4eEDEd",
		    "id": "68dd2e57-0166-5398-0015-000000010003",
		    "message": "Blockchain Verified Certificate of Purity for So Pure Supplements XParasite. Batch Code: A5F37E33CB45 Certifying authority: Blockchain Institute of Technology. https://verify.blockchaininstitute.com/ipfs/bafybeigiy6z3mg255bee7wf3pzdekcdqnvj37u55m5agdtrutn7mkuicyq",
		    "success": true,
		    "tag": "input_data_message_v1",
		    "to_address": "0xEc84F0B4d6FaCF98185bA4889CeD612e25D02483",
		  },
		]
	`);
});
