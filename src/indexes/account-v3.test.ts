import { test } from "vitest";

import { test_getBlock } from "@/tests/utils";
import { event } from "@/events/erc20-transfer-v3/event";
import { getEventIdsForAccount, index_account_v3 } from "./account-v3";

test.concurrent("account-v3", async ({ expect }) => {
	const block_number = 10000000;

	const block = await test_getBlock({ chain: 1, block_number });

	const indexes = event.handler(block).flatMap((event) => {
		return [
			{ event_id: event.id, account: event.to_address }, //
			{ event_id: event.id, account: event.from_address },
			{ event_id: event.id, account: event.token_address },
		];
	});

	await index_account_v3.delete(indexes);

	await index_account_v3.upsert(indexes);

	const ids = await getEventIdsForAccount("0xdAC17F958D2ee523a2206206994597C13D831ec7", {
		limit: 14,
		order: "reverse",
	});

	expect(ids).toMatchInlineSnapshot(`
		[
		  "5eb0170500989680000700000300010009",
		  "5eb0170500989680001100000800010009",
		  "5eb0170500989680003900005800010009",
		  "5eb0170500989680003c00005b00010009",
		  "5eb0170500989680003d00005c00010009",
		  "5eb0170500989680003f00006100010009",
		  "5eb0170500989680004000006200010009",
		  "5eb0170500989680004400006700010009",
		  "5eb0170500989680004500006800010009",
		  "5eb0170500989680004b00006c00010009",
		  "5eb0170500989680005100007700010009",
		  "5eb0170500989680005800007e00010009",
		  "5eb0170500989680005e00008200010009",
		  "5eb0170500989680006300008600010009",
		]
	`);
});
