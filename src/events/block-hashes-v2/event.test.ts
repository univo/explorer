import { test } from "vitest";

import { db } from "@/db/client";
import { getBlockNumber } from "./event";
import { test_getBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("block_hashes_v2", async ({ expect }) => {
	const block_number = 10000000;

	const block = await test_getBlock({ chain: 1, block_number });

	await db.command({
		query: `DELETE from kv_block_hashes_v2 where block_hash = unhex('${block.eth_getBlockByNumber.hash.slice(2)}')`,
	});

	await test_writeEvents(block, "block_hashes_v2");

	const result = await getBlockNumber(block.eth_getBlockByNumber.hash);

	expect(result).toEqual(block_number);
});
