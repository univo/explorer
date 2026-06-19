import { test } from "vitest";

import { getErc20ApprovalV2 } from "./event";
import { test_deleteEvents, test_getBlock, test_v2_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("erc20_approval_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10000000 });

	await test_deleteEvents(block, "event_erc20_approval_v2");

	await test_writeEvents(block, "erc20_approval_v2");

	const ids = await test_v2_getEventIdsForBlock(block, "event_erc20_approval_v2");
	const events = await getErc20ApprovalV2(ids);

	expect(events).toHaveLength(13);
	expect(events).toEqual(
		expect.arrayContaining([
			{
				id: "5eb0170500989680001800100001000b",
				owner_address: "0xbce5fe052b25e422550f6012fdd1941f9353f001",
				quantity: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
				spender_address: "0x8a91c9a16cd62693649d80afa85a09dbbdcb8508",
				success: true,
				tag: "erc20_approval_v2",
				token_address: "0x8e870d67f660d95d5be530380d0ec0bd388289e1",
			},
			{
				id: "5eb0170500989680005000760001000b",
				owner_address: "0x09e80bde912794fdbea1e5b68b0c37a346b73cfc",
				quantity: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
				spender_address: "0x882d80d3a191859d64477eb78cca46599307ec1c",
				success: true,
				tag: "erc20_approval_v2",
				token_address: "0x6b175474e89094c44da98b954eedeac495271d0f",
			},
		]),
	);
});
