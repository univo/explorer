import { test } from "vitest";

import { event, getIntentAaveV3BorrowV1 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_aave_v3_borrow_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25621865 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getIntentAaveV3BorrowV1(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_aave_v3_borrow_v1", //
					"intent_aave_v3_borrow_v1_index_account_v3",
					"intent_aave_v3_borrow_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getIntentAaveV3BorrowV1(ids);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "borrower_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "id": "6a66e3830186f56900bcffffff00010019",
		    "interest_rate_mode": "0x02",
		    "on_behalf_of_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "quantity": "0x04edf12cb800",
		    "referral_code": "0x00",
		    "success": true,
		    "tag": "intent_aave_v3_borrow_v1",
		    "token_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		  },
		]
	`);
});

test.concurrent("intent_aave_v3_borrow_v1 handles all function selectors", async ({ expect }) => {
	const b25621865 = await test_getBlock({ chain: 1, block_number: 25621865 });

	expect(event.handler(b25621865)).toMatchInlineSnapshot(`
		[
		  {
		    "borrower_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "id": "6a66e3830186f56900bcffffff00010019",
		    "interest_rate_mode": "0x2",
		    "on_behalf_of_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "quantity": "0x4edf12cb800",
		    "referral_code": "0x0",
		    "success": true,
		    "token_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		  },
		]
	`);
});

test.concurrent("intent_aave_v3_borrow_v1 includes failed submissions", async ({ expect }) => {
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
		    "borrower_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "id": "6a66e3830186f56900bcffffff00010019",
		    "interest_rate_mode": "0x2",
		    "on_behalf_of_address": "0xCf0a12CBd8088fc5f84ad431E71787157041cD69",
		    "quantity": "0x4edf12cb800",
		    "referral_code": "0x0",
		    "success": false,
		    "token_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		  },
		]
	`);
});
