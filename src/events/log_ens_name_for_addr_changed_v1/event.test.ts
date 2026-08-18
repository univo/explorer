import { test } from "vitest";

import { event, getLogEnsNameForAddrChangedV1 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("log_ens_name_for_addr_changed_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25774800 });
	const events = event.handler(block);

	expect(events).toContainEqual(
		expect.objectContaining({
			name: "etherscanofficial.eth",
			account_address: "0x8D56AeBB8321c6964943DfA056Bbd7261fEc9214",
		}),
	);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);
	expect(await getLogEnsNameForAddrChangedV1(ids)).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [{ blocks: [block], events: ["log_ens_name_for_addr_changed_v1"] }],
	});

	const stored = await getLogEnsNameForAddrChangedV1(ids);

	expect(stored).toHaveLength(events.length);
	expect(stored).toContainEqual(
		expect.objectContaining({
			success: true,
			tag: "log_ens_name_for_addr_changed_v1",
			name: "etherscanofficial.eth",
			account_address: "0x8D56AeBB8321c6964943DfA056Bbd7261fEc9214",
		}),
	);
});
