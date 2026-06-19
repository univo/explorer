import { test } from "vitest";

import { db } from "@/db/client";
import { getTx } from "./event";
import { hexToNumber } from "@/utils";
import { test_getBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("tx_hashes_v2", async ({ expect }) => {
	const block_number = 10000000;

	const block = await test_getBlock({ chain: 1, block_number });

	const [tx] = block.eth_getBlockByNumber.transactions;

	await db.command({
		query: `DELETE FROM kv_tx_hashes_v2 WHERE tx_hash = unhex('${tx.hash.slice(2)}')`,
	});

	await test_writeEvents(block, "tx_hashes_v2");

	const result = await getTx(tx.hash);

	expect(result).toMatchObject({
		block_number: hexToNumber(tx.blockNumber),
		tx_index: hexToNumber(tx.transactionIndex),
	});
});
