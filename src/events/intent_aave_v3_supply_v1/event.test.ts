import { test } from "vitest";

import { event, getIntentAaveV3SupplyV1 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_aave_v3_supply_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25621890 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getIntentAaveV3SupplyV1(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_aave_v3_supply_v1", //
					"intent_aave_v3_supply_v1_index_account_v3",
					"intent_aave_v3_supply_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getIntentAaveV3SupplyV1(ids);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "id": "6a66e4af0186f58200acffffff00010017",
		    "on_behalf_of_address": "0xD411D428a63cf4c7029Bc53f0e0f56C4933FDbb7",
		    "quantity": "0x1e44dc0520",
		    "referral_code": "0x00",
		    "success": true,
		    "supplier_address": "0xD411D428a63cf4c7029Bc53f0e0f56C4933FDbb7",
		    "tag": "intent_aave_v3_supply_v1",
		    "token_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		  },
		]
	`);
});

test.concurrent("intent_aave_v3_supply_v1 handles all function selectors", async ({ expect }) => {
	const b25621890 = await test_getBlock({ chain: 1, block_number: 25621890 });

	expect(event.handler(b25621890)).toMatchInlineSnapshot(`
		[
		  {
		    "id": "6a66e4af0186f58200acffffff00010017",
		    "on_behalf_of_address": "0xD411D428a63cf4c7029Bc53f0e0f56C4933FDbb7",
		    "quantity": "0x1e44dc0520",
		    "referral_code": "0x0",
		    "success": true,
		    "supplier_address": "0xD411D428a63cf4c7029Bc53f0e0f56C4933FDbb7",
		    "token_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		  },
		]
	`);

	const b25622082 = await test_getBlock({ chain: 1, block_number: 25622082 });

	expect(event.handler(b25622082)).toMatchInlineSnapshot(`
		[
		  {
		    "id": "6a66edbb0186f6420062ffffff00010017",
		    "on_behalf_of_address": "0x7F7c47b9a4160cB500F40aeD289b67857701a9Ac",
		    "quantity": "0x2723d945db3dad54",
		    "referral_code": "0x0",
		    "success": true,
		    "supplier_address": "0x7F7c47b9a4160cB500F40aeD289b67857701a9Ac",
		    "token_address": "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
		  },
		]
	`);

	const b25635372 = await test_getBlock({ chain: 1, block_number: 25635372 });

	expect(event.handler(b25635372)).toMatchInlineSnapshot(`
		[
		  {
		    "id": "6a695f2f01872a2c0107ffffff00010017",
		    "on_behalf_of_address": "0x44d15Af7b0A5651EaA4a2F653a352Ca5763aaeC3",
		    "quantity": "0x28ab6d0",
		    "referral_code": "0x0",
		    "success": true,
		    "supplier_address": "0x44d15Af7b0A5651EaA4a2F653a352Ca5763aaeC3",
		    "token_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		  },
		]
	`);
});

test.concurrent("intent_aave_v3_supply_v1 includes failed submissions", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25621890 });

	const failed = {
		...block,

		eth_getBlockReceipts: block.eth_getBlockReceipts.map((receipt) => {
			if (receipt.transactionHash !== "0x63ce709568399533f200372a464ac5c6bf1ced6e30be4c061faf651ca812af63") {
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
		    "id": "6a66e4af0186f58200acffffff00010017",
		    "on_behalf_of_address": "0xD411D428a63cf4c7029Bc53f0e0f56C4933FDbb7",
		    "quantity": "0x1e44dc0520",
		    "referral_code": "0x0",
		    "success": false,
		    "supplier_address": "0xD411D428a63cf4c7029Bc53f0e0f56C4933FDbb7",
		    "token_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		  },
		]
	`);
});
