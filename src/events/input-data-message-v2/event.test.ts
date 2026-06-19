import { test } from "vitest";

import { event, getInputDataMessageV2 } from "./event";
import { test_getBlock, test_v2_getEventIdsForBlock, test_client } from "@/tests/utils";

test.concurrent("input_data_message_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 23483288 });

	if (event.storage.delete) {
		await event.storage.delete(event.handler(block));
	}

	await test_client.request({
		method: "private_writeEvents",
		params: [{ events: ["input_data_message_v2"], blocks: [block] }],
	});

	const ids = await test_v2_getEventIdsForBlock(block, "event_input_data_message_v2");

	const events = await getInputDataMessageV2(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "from_address": "0x878761636a1Dd513463B04A66413C77E8B4eEDEd",
		    "id": "68dd2e5701665398001500000001000c",
		    "message": "Blockchain Verified Certificate of Purity for So Pure Supplements XParasite. Batch Code: A5F37E33CB45 Certifying authority: Blockchain Institute of Technology. https://verify.blockchaininstitute.com/ipfs/bafybeigiy6z3mg255bee7wf3pzdekcdqnvj37u55m5agdtrutn7mkuicyq",
		    "success": true,
		    "tag": "input_data_message_v2",
		    "to_address": "0xEc84F0B4d6FaCF98185bA4889CeD612e25D02483",
		  },
		]
	`);
});
