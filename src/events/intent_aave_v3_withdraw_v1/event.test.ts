import { test } from "vitest";

import { event, getIntentAaveV3WithdrawV1 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_aave_v3_withdraw_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25621865 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getIntentAaveV3WithdrawV1(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_aave_v3_withdraw_v1", //
					"intent_aave_v3_withdraw_v1_index_account_v3",
					"intent_aave_v3_withdraw_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getIntentAaveV3WithdrawV1(ids);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "id": "6a66e3830186f5690045ffffff00010018",
		    "quantity": "0x3c89352800",
		    "recipient_address": "0x156e1F33761676C559Ca656c32b77Df85d18AEAD",
		    "success": true,
		    "tag": "intent_aave_v3_withdraw_v1",
		    "token_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		    "withdrawer_address": "0x156e1F33761676C559Ca656c32b77Df85d18AEAD",
		  },
		]
	`);
});

test.concurrent("intent_aave_v3_withdraw_v1 handles all function selectors", async ({ expect }) => {
	const b25621865 = await test_getBlock({ chain: 1, block_number: 25621865 });

	expect(event.handler(b25621865)).toMatchInlineSnapshot(`
		[
		  {
		    "id": "6a66e3830186f5690045ffffff00010018",
		    "quantity": "0x3c89352800",
		    "recipient_address": "0x156e1F33761676C559Ca656c32b77Df85d18AEAD",
		    "success": true,
		    "token_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		    "withdrawer_address": "0x156e1F33761676C559Ca656c32b77Df85d18AEAD",
		  },
		]
	`);

	const b25621839 = await test_getBlock({ chain: 1, block_number: 25621839 });

	expect(event.handler(b25621839)).toMatchInlineSnapshot(`
		[
		  {
		    "id": "6a66e24b0186f54f005effffff00010018",
		    "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		    "recipient_address": "0x64c2fA27Ee7eddcCF9Ba05C410fBfa36a29946EC",
		    "success": true,
		    "token_address": "0xe343167631d89B6Ffc58B88d6b7fB0228795491D",
		    "withdrawer_address": "0x64c2fA27Ee7eddcCF9Ba05C410fBfa36a29946EC",
		  },
		]
	`);
});

test.concurrent("intent_aave_v3_withdraw_v1 includes failed submissions", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25621865 });

	const failed = {
		...block,

		eth_getBlockReceipts: block.eth_getBlockReceipts.map((receipt) => {
			if (receipt.transactionHash !== "0x7a907bb5013ccc0767bf0b80ec533899625b2d6305a6ab5cd26cc29e8ab45996") {
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
		    "id": "6a66e3830186f5690045ffffff00010018",
		    "quantity": "0x3c89352800",
		    "recipient_address": "0x156e1F33761676C559Ca656c32b77Df85d18AEAD",
		    "success": false,
		    "token_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		    "withdrawer_address": "0x156e1F33761676C559Ca656c32b77Df85d18AEAD",
		  },
		]
	`);
});
