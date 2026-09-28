import { test } from "vitest";

import { event, getIntentAaveV3RepayV2 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_aave_v3_repay_v2 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25621858 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getIntentAaveV3RepayV2(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_aave_v3_repay_v2", //
					"intent_aave_v3_repay_v2_index_account_v4",
					"intent_aave_v3_repay_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getIntentAaveV3RepayV2(ids);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 25621858,
		    "block_timestamp": 2026-07-27T04:48:47.000Z,
		    "chain": 1,
		    "id": "6a66e32f0186f562007cffffff00010040",
		    "log_index": 16777215,
		    "on_behalf_of_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "quantity": "0x049da91a1da4b0b228f87f",
		    "repayer_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "success": true,
		    "tag": "intent_aave_v3_repay_v2",
		    "token_address": "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3",
		    "tx_index": 124,
		  },
		]
	`);
});

test.concurrent("intent_aave_v3_repay_v2 handles all function selectors", async ({ expect }) => {
	const b25621858 = await test_getBlock({ chain: 1, block_number: 25621858 });

	expect(event.handler(b25621858)).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 25621858,
		    "block_timestamp": 2026-07-27T04:48:47.000Z,
		    "chain": 1,
		    "id": "6a66e32f0186f562007cffffff00010040",
		    "log_index": 16777215,
		    "on_behalf_of_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "quantity": "0x49da91a1da4b0b228f87f",
		    "repayer_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "success": true,
		    "token_address": "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3",
		    "tx_index": 124,
		  },
		]
	`);

	const b25622279 = await test_getBlock({ chain: 1, block_number: 25622279 });

	expect(event.handler(b25622279)).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 25622279,
		    "block_timestamp": 2026-07-27T06:13:35.000Z,
		    "chain": 1,
		    "id": "6a66f70f0186f7070033ffffff00010040",
		    "log_index": 16777215,
		    "on_behalf_of_address": "0x282E75F8a72919581994729766189d3aDd339897",
		    "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		    "repayer_address": "0x282E75F8a72919581994729766189d3aDd339897",
		    "success": true,
		    "token_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		    "tx_index": 51,
		  },
		]
	`);

	const b25621977 = await test_getBlock({ chain: 1, block_number: 25621977 });

	expect(event.handler(b25621977)).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 25621977,
		    "block_timestamp": 2026-07-27T05:12:35.000Z,
		    "chain": 1,
		    "id": "6a66e8c30186f5d9003fffffff00010040",
		    "log_index": 16777215,
		    "on_behalf_of_address": "0x1deD480959Ac0Ccc36757E26D10F83DF44eAe808",
		    "quantity": "0x63a47bf56f4e0000",
		    "repayer_address": "0x1deD480959Ac0Ccc36757E26D10F83DF44eAe808",
		    "success": true,
		    "token_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		    "tx_index": 63,
		  },
		]
	`);
});

test.concurrent("intent_aave_v3_repay_v2 includes failed submissions", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25621858 });

	const failed = {
		...block,

		eth_getBlockReceipts: block.eth_getBlockReceipts.map((receipt) => {
			if (receipt.transactionHash !== "0x7a0271e9e1a59a49df1d93a29f4fb3cf49664e93c6ce738efaac100f0d1649db") {
				return receipt;
			}

			return {
				...receipt,
				status: "0x0" as const,
			};
		}),
	};

	expect(event.handler(failed)).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 25621858,
		    "block_timestamp": 2026-07-27T04:48:47.000Z,
		    "chain": 1,
		    "id": "6a66e32f0186f562007cffffff00010040",
		    "log_index": 16777215,
		    "on_behalf_of_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "quantity": "0x49da91a1da4b0b228f87f",
		    "repayer_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "success": false,
		    "token_address": "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3",
		    "tx_index": 124,
		  },
		]
	`);
});
