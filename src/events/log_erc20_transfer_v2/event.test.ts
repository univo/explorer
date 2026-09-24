import { test } from "vitest";
import { numberToHex } from "viem";

import { TABLES } from "@/constants";
import { createId } from "@/helpers";
import { event, getLogErc20TransferV2 } from "./event";
import { test_getBlock, test_client } from "@/tests/utils";

test.concurrent("log_erc20_transfer_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10000000 });

	await event.storage.delete(event.handler(block));

	const ids = event.handler(block).map((event) => {
		return createId({
			chainId: numberToHex(event.chain),
			txIndex: numberToHex(event.tx_index),
			tableId: TABLES.log_erc20_transfer_v2,
			logIndex: numberToHex(event.log_index),
			blockNumber: numberToHex(event.block_number),
			blockTimestamp: numberToHex(event.block_timestamp.getTime() / 1000),
		});
	});

	const initial = await getLogErc20TransferV2(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"log_erc20_transfer_v2", //
					"log_erc20_transfer_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const events = await getLogErc20TransferV2(ids);

	expect(events).toMatchInlineSnapshot();
});
