import { expect, test } from "vitest";

import { test_getBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("block_hashes_v1", async () => {
	const block_number = 10000000;

	const block = await test_getBlock({ chain: 1, block_number });
	const response = await test_writeEvents(block, "block_hashes_v1");

	expect(response.error).toBeUndefined();

	expect(response.result).toMatchObject({ failures: [] });
});
