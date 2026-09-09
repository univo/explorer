import { test } from "vitest";

import { TABLES } from "@/constants";
import { test_getBlock } from "@/tests/utils";
import { event } from "@/events/intent_native_transfer_v1/event";
import { getEventIdsForAccount, index_account_v4 } from "./index_account_v4";

test.concurrent("index_account_v4", async ({ expect }) => {
	const block_number = 10000000;

	const block = await test_getBlock({ chain: 1, block_number });

	const indexes = event.handler(block).flatMap((event) => {
		return [
			{ event_id: event.id, account: event.to_address }, //
			{ event_id: event.id, account: event.from_address },
		];
	});

	await index_account_v4.delete(indexes);

	await index_account_v4.upsert(indexes);

	const ids = await getEventIdsForAccount("0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8", {
		limit: 14,
		chains: [1],
		order: "reverse",
		tables: [TABLES.intent_native_transfer_v1],
	});

	expect(ids).toMatchInlineSnapshot(`
		[
		  "5eb01705009896800000ffffff0001001f",
		]
	`);
});
