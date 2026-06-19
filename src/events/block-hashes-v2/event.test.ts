import { test } from "vitest";

import { event, getBlockNumber } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("block_hashes_v2", async ({ expect }) => {
	const block_number = 10000000;

	const block = await test_getBlock({ chain: 1, block_number });

	if (event.storage.delete) {
		await event.storage.delete(event.handler(block));
	}

	const initial = await getBlockNumber(block.eth_getBlockByNumber.hash);

	expect(initial).toEqual(null);

	await test_client.request({
		method: "private_writeEvents",
		params: [{ events: ["block_hashes_v2"], blocks: [block] }],
	});

	const result = await getBlockNumber(block.eth_getBlockByNumber.hash);

	expect(result).toEqual(block_number);
});
