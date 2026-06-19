import { test } from "vitest";

import { getNativeTransferV2 } from "./event";
import { test_deleteEvents, test_getBlock, test_v2_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("native_transfer_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10000000 });

	await test_deleteEvents(block, "event_native_transfer_v2");

	await test_writeEvents(block, "native_transfer_v2");

	const ids = await test_v2_getEventIdsForBlock(block, "event_native_transfer_v2");
	const events = await getNativeTransferV2(ids);

	expect(events).toHaveLength(38);
	expect(events).toEqual(
		expect.arrayContaining([
			{
				from_address: "0xea674fdde714fd979de3edf0f56aa9716b898ec8",
				id: "5eb0170500989680000000000001000a",
				quantity: "384134310464384681",
				success: true,
				tag: "native_transfer_v2",
				to_address: "0x60f18d941f6253e3f7082ea0db3bc3944e7e9d40",
			},
			{
				from_address: "0xb0339aa29411085bbf7666136acc34b9d588431f",
				id: "5eb0170500989680003600000001000a",
				quantity: "100000000000000",
				success: false,
				tag: "native_transfer_v2",
				to_address: "0x0c045faf60f5df62ebdcb25a8d7437f31ab5ef8a",
			},
			{
				from_address: "0x8a9d69aa686fa0f9bbdec21294f67d4d9cfb4a3e",
				id: "5eb0170500989680006600000001000a",
				quantity: "2000000000000000000",
				success: true,
				tag: "native_transfer_v2",
				to_address: "0xd69b8ff1888e78d9c337c2f2e6b3bf3e7357800e",
			},
		]),
	);
});
