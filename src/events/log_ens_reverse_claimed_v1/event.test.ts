import { test } from "vitest";

import { event, getLogEnsReverseClaimedV1 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("log_ens_reverse_claimed_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25770632 });
	const events = event.handler(block);

	expect(events).toContainEqual(
		expect.objectContaining({
			node: "0x2eaf481c711aa75ef5f72810e28d92c9fb27e79db947366b8371c69cee4def52",
			account_address: "0x33b86899aFFfDdac63cFB1038370450e69530F70",
		}),
	);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);
	expect(await getLogEnsReverseClaimedV1(ids)).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [{ blocks: [block], events: ["log_ens_reverse_claimed_v1"] }],
	});

	const stored = await getLogEnsReverseClaimedV1(ids);

	expect(stored).toHaveLength(events.length);
	expect(stored).toContainEqual(
		expect.objectContaining({
			success: true,
			tag: "log_ens_reverse_claimed_v1",
			node: "0x2eaf481c711aa75ef5f72810e28d92c9fb27e79db947366b8371c69cee4def52",
			account_address: "0x33b86899aFFfDdac63cFB1038370450e69530F70",
		}),
	);
});
