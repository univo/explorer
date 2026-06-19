import { test } from "vitest";

import { getErc721TransferV2 } from "./event";
import { test_deleteEvents, test_getBlock, test_v2_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("erc721_transfer_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10000000 });

	await test_deleteEvents(block, "event_erc721_transfer_v2");

	await test_writeEvents(block, "erc721_transfer_v2");

	const ids = await test_v2_getEventIdsForBlock(block, "event_erc721_transfer_v2");
	const events = await getErc721TransferV2(ids);

	expect(events).toHaveLength(12);
	expect(events).toEqual(
		expect.arrayContaining([
			{
				from_address: "0xa6fa96567abc0ea45e6683a0b29ca575fdf8af85",
				id: "5eb01705009896800026004100010010",
				success: true,
				tag: "erc721_transfer_v2",
				to_address: "0x074fdc302f8d3c0e8b11c80f2a07bf2a3b8ca855",
				token_address: "0x2594d80da5f2e4f742d1e479eb9408aad132d0bd",
				token_id: "8092",
			},
			{
				from_address: "0xa6fa96567abc0ea45e6683a0b29ca575fdf8af85",
				id: "5eb01705009896800026004c00010010",
				success: true,
				tag: "erc721_transfer_v2",
				to_address: "0x074fdc302f8d3c0e8b11c80f2a07bf2a3b8ca855",
				token_address: "0x2594d80da5f2e4f742d1e479eb9408aad132d0bd",
				token_id: "8217",
			},
		]),
	);
});
