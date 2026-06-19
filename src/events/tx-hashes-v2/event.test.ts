import { test } from "vitest";
import { hexToNumber } from "@/utils";
import { event, getTx } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("tx_hashes_v2", async ({ expect }) => {
	const block_number = 10000000;

	const block = await test_getBlock({ chain: 1, block_number });

	if (event.storage.delete) {
		await event.storage.delete(event.handler(block));
	}

	await test_client.request({
		method: "private_writeEvents",
		params: [{ events: ["tx_hashes_v2"], blocks: [block] }],
	});

	const [tx] = block.eth_getBlockByNumber.transactions;

	const result = await getTx(tx.hash);

	expect(result).toMatchObject({
		block_number: hexToNumber(tx.blockNumber),
		tx_index: hexToNumber(tx.transactionIndex),
	});
});
