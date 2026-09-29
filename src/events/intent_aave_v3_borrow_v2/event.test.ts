import { test } from "vitest";

import { event, getIntentAaveV3BorrowV2 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_aave_v3_borrow_v2 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25621865 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const initial = await getIntentAaveV3BorrowV2(events);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_aave_v3_borrow_v2", //
					"intent_aave_v3_borrow_v2_index_account_v4",
					"intent_aave_v3_borrow_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getIntentAaveV3BorrowV2(events);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 25621865,
		    "block_timestamp": 2026-07-27T04:50:11.000Z,
		    "borrower_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "chain": 1,
		    "id": "6a66e3830186f56900bcffffff0001003f",
		    "interest_rate_mode": "0x02",
		    "log_index": 16777215,
		    "on_behalf_of_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "quantity": "0x04edf12cb800",
		    "referral_code": "0x00",
		    "success": true,
		    "tag": "intent_aave_v3_borrow_v2",
		    "token_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		    "tx_index": 188,
		  },
		]
	`);
});

test.concurrent("intent_aave_v3_borrow_v2 handles all function selectors", async ({ expect }) => {
	const b25621865 = await test_getBlock({ chain: 1, block_number: 25621865 });

	expect(event.handler(b25621865)).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 25621865,
		    "block_timestamp": 2026-07-27T04:50:11.000Z,
		    "borrower_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "chain": 1,
		    "id": "6a66e3830186f56900bcffffff0001003f",
		    "interest_rate_mode": "0x2",
		    "log_index": 16777215,
		    "on_behalf_of_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "quantity": "0x4edf12cb800",
		    "referral_code": "0x0",
		    "success": true,
		    "token_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		    "tx_index": 188,
		  },
		]
	`);
});

test.concurrent("intent_aave_v3_borrow_v2 includes failed submissions", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25621865 });

	const failed = {
		...block,

		eth_getBlockReceipts: block.eth_getBlockReceipts.map((receipt) => {
			if (receipt.transactionHash !== "0x1dab6fb35cff56e58d4fed58888abfb559bca0d6cab8adb6596e02b28d4a5a09") {
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
		    "block_number": 25621865,
		    "block_timestamp": 2026-07-27T04:50:11.000Z,
		    "borrower_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "chain": 1,
		    "id": "6a66e3830186f56900bcffffff0001003f",
		    "interest_rate_mode": "0x2",
		    "log_index": 16777215,
		    "on_behalf_of_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "quantity": "0x4edf12cb800",
		    "referral_code": "0x0",
		    "success": false,
		    "token_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		    "tx_index": 188,
		  },
		]
	`);
});
