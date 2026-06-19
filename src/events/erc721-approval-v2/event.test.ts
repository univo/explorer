import { test } from "vitest";

import { getErc721ApprovalV2 } from "./event";
import { test_deleteEvents, test_getBlock, test_v2_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("erc721_approval_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 13657776 });

	await test_deleteEvents(block, "event_erc721_approval_v2");

	await test_writeEvents(block, "erc721_approval_v2");

	const ids = await test_v2_getEventIdsForBlock(block, "event_erc721_approval_v2");
	const events = await getErc721ApprovalV2(ids);

	expect(events).toHaveLength(8);
	expect(events).toEqual(
		expect.arrayContaining([
			{
				id: "619a272e00d066b000bb009900010011",
				owner_address: "0x269424e2654ddf7683e71eaada2ba363fab37370",
				spender_address: "0x0000000000000000000000000000000000000000",
				success: true,
				tag: "erc721_approval_v2",
				token_address: "0x0b4b2ba334f476c8f41bfe52a428d6891755554d",
				token_id: "1243",
			},
			{
				id: "619a272e00d066b00123012f00010011",
				owner_address: "0xd7fc4ab828afc1bb4b217f337f1777ca856efd12",
				spender_address: "0x0000000000000000000000000000000000000000",
				success: true,
				tag: "erc721_approval_v2",
				token_address: "0x01a9f037d4cd7da318ab097a47acd4dea3abc083",
				token_id: "997",
			},
		]),
	);
});
