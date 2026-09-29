import { test } from "vitest";

import { test_getBlock } from "@/tests/utils";
import { event as log_erc20_transfer_v2 } from "@/events/log_erc20_transfer_v2/event";
import { event as intent_native_transfer_v2 } from "@/events/intent_native_transfer_v2/event";
import { getEventIdsForBlockNumber, getEventIdsForTxPosition, index_block_number_tx_index_v4 } from "./index_block_number_tx_index_v4";

test.concurrent("intent_native_transfer_v2", async ({ expect }) => {
	const block_number = 10000000;

	const block = await test_getBlock({ chain: 1, block_number });

	const indexes = intent_native_transfer_v2.handler(block);

	await index_block_number_tx_index_v4.delete(indexes);

	await index_block_number_tx_index_v4.upsert(indexes);

	const ids = await getEventIdsForBlockNumber(1, block_number);

	expect(ids).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 0,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 1,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 2,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 3,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 4,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 8,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 9,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 10,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 15,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 16,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 19,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 23,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 35,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 37,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 39,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 40,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 41,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 42,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 44,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 45,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 47,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 48,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 54,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 55,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 71,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 72,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 76,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 77,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 95,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 98,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "log_index": 16777215,
		    "tag": "intent_native_transfer_v2",
		    "tx_index": 102,
		  },
		]
	`);
});

test.concurrent("log_erc20_transfer_v2", async ({ expect }) => {
	const block_number = 20000000;

	const block = await test_getBlock({ chain: 1, block_number });

	const indexes = log_erc20_transfer_v2.handler(block);

	await index_block_number_tx_index_v4.delete(indexes);

	await index_block_number_tx_index_v4.upsert(indexes);

	const ids = await getEventIdsForTxPosition(1, block_number, 0);

	expect(ids).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 20000000,
		    "block_timestamp": 2024-06-01T22:36:47.000Z,
		    "chain": 1,
		    "log_index": 0,
		    "tag": "log_erc20_transfer_v2",
		    "tx_index": 0,
		  },
		  {
		    "block_number": 20000000,
		    "block_timestamp": 2024-06-01T22:36:47.000Z,
		    "chain": 1,
		    "log_index": 1,
		    "tag": "log_erc20_transfer_v2",
		    "tx_index": 0,
		  },
		  {
		    "block_number": 20000000,
		    "block_timestamp": 2024-06-01T22:36:47.000Z,
		    "chain": 1,
		    "log_index": 4,
		    "tag": "log_erc20_transfer_v2",
		    "tx_index": 0,
		  },
		  {
		    "block_number": 20000000,
		    "block_timestamp": 2024-06-01T22:36:47.000Z,
		    "chain": 1,
		    "log_index": 5,
		    "tag": "log_erc20_transfer_v2",
		    "tx_index": 0,
		  },
		  {
		    "block_number": 20000000,
		    "block_timestamp": 2024-06-01T22:36:47.000Z,
		    "chain": 1,
		    "log_index": 8,
		    "tag": "log_erc20_transfer_v2",
		    "tx_index": 0,
		  },
		  {
		    "block_number": 20000000,
		    "block_timestamp": 2024-06-01T22:36:47.000Z,
		    "chain": 1,
		    "log_index": 9,
		    "tag": "log_erc20_transfer_v2",
		    "tx_index": 0,
		  },
		  {
		    "block_number": 20000000,
		    "block_timestamp": 2024-06-01T22:36:47.000Z,
		    "chain": 1,
		    "log_index": 12,
		    "tag": "log_erc20_transfer_v2",
		    "tx_index": 0,
		  },
		  {
		    "block_number": 20000000,
		    "block_timestamp": 2024-06-01T22:36:47.000Z,
		    "chain": 1,
		    "log_index": 13,
		    "tag": "log_erc20_transfer_v2",
		    "tx_index": 0,
		  },
		]
	`);
});
