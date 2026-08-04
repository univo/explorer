import { test } from "vitest";

import { isHexEqual } from "@/utils";
import { event, getIntentUniswapV3MintV1 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_uniswap_v3_mint_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25678336 });
	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);
	const initial = await getIntentUniswapV3MintV1(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_uniswap_v3_mint_v1", //
					"intent_uniswap_v3_mint_v1_index_account_v3",
					"intent_uniswap_v3_mint_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getIntentUniswapV3MintV1(ids);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "fee": "0x0bb8",
		    "id": "6a7143c70187d200004cffffff0001001c",
		    "pool_address": "0x127452F3f9cDc0389b0Bf59ce6131aA3Bd763598",
		    "recipient_address": "0xC216BfA5dA000965E820845c32e6FD88DB275743",
		    "sender_address": "0xC216BfA5dA000965E820845c32e6FD88DB275743",
		    "success": true,
		    "tag": "intent_uniswap_v3_mint_v1",
		    "token_0_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		    "token_0_desired_quantity": "0x51b3286251944c00",
		    "token_0_minimum_quantity": "0x4987a45872382000",
		    "token_1_address": "0xD31a59c85aE9D8edEFeC411D448f90841571b89c",
		    "token_1_desired_quantity": "0x05b8ff49e2",
		    "token_1_minimum_quantity": "0x05267f5c18",
		  },
		]
	`);
});

test.concurrent("intent_uniswap_v3_mint_v1 decodes mint submissions", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25678336 });

	expect(event.handler(block)).toMatchInlineSnapshot(`
		[
		  {
		    "fee": "0xbb8",
		    "id": "6a7143c70187d200004cffffff0001001c",
		    "pool_address": "0x127452F3f9cDc0389b0Bf59ce6131aA3Bd763598",
		    "recipient_address": "0xC216BfA5dA000965E820845c32e6FD88DB275743",
		    "sender_address": "0xC216BfA5dA000965E820845c32e6FD88DB275743",
		    "success": true,
		    "token_0_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		    "token_0_desired_quantity": "0x51b3286251944c00",
		    "token_0_minimum_quantity": "0x4987a45872382000",
		    "token_1_address": "0xD31a59c85aE9D8edEFeC411D448f90841571b89c",
		    "token_1_desired_quantity": "0x5b8ff49e2",
		    "token_1_minimum_quantity": "0x5267f5c18",
		  },
		]
	`);
});

test.concurrent("intent_uniswap_v3_mint_v1 includes failed submissions", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25678336 });

	const failed = {
		...block,

		eth_getBlockReceipts: block.eth_getBlockReceipts.map((receipt) => {
			if (isHexEqual(receipt.transactionHash, "0x7018d42519dd958fd701b25c33b3af9c4688cbbf8d4de10859ac535fd8f0c03f")) {
				return {
					...receipt,
					status: "0x0" as const,
				};
			}

			return receipt;
		}),
	};

	expect(event.handler(failed)).toMatchInlineSnapshot(`
		[
		  {
		    "fee": "0xbb8",
		    "id": "6a7143c70187d200004cffffff0001001c",
		    "pool_address": "0x127452F3f9cDc0389b0Bf59ce6131aA3Bd763598",
		    "recipient_address": "0xC216BfA5dA000965E820845c32e6FD88DB275743",
		    "sender_address": "0xC216BfA5dA000965E820845c32e6FD88DB275743",
		    "success": false,
		    "token_0_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		    "token_0_desired_quantity": "0x51b3286251944c00",
		    "token_0_minimum_quantity": "0x4987a45872382000",
		    "token_1_address": "0xD31a59c85aE9D8edEFeC411D448f90841571b89c",
		    "token_1_desired_quantity": "0x5b8ff49e2",
		    "token_1_minimum_quantity": "0x5267f5c18",
		  },
		]
	`);
});
