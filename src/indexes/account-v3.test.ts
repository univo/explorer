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
		  "5eb01705009896800007000300010009",
		  "5eb01705009896800011000800010009",
		  "5eb01705009896800039005800010009",
		  "5eb0170500989680003c005b00010009",
		  "5eb0170500989680003d005c00010009",
		  "5eb0170500989680003f006100010009",
		  "5eb01705009896800040006200010009",
		  "5eb01705009896800044006700010009",
		  "5eb01705009896800045006800010009",
		  "5eb0170500989680004b006c00010009",
		  "5eb01705009896800051007700010009",
		  "5eb01705009896800058007e00010009",
		  "5eb0170500989680005e008200010009",
		  "5eb01705009896800063008600010009",
		]
	`);
});
