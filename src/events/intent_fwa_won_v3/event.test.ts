import { test } from "vitest";

import { event, getIntentFwaWonV3 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_fwa_won_v3 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25641950 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const initial = await getIntentFwaWonV3(events);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_fwa_won_v3", //
					"intent_fwa_won_v3_index_account_v4",
					"intent_fwa_won_v3_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getIntentFwaWonV3(events);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 25641950,
		    "block_timestamp": 2026-07-30T00:02:23.000Z,
		    "chain": 1,
		    "listing_id": "0xf8ac",
		    "log_index": 16777215,
		    "payout_eth": "0x0fccc3b7ccc84000",
		    "purchaser_address": "0x5984bb82F11171cb1DC2287E2A6935c44D491538",
		    "settlement_type": "kept",
		    "success": true,
		    "tag": "intent_fwa_won_v3",
		    "token_out": "0x00",
		    "tx_index": 69,
		  },
		]
	`);
});

test.concurrent("intent_fwa_won_v3 handles all settlement types", async ({ expect }) => {
	const b25641950 = await test_getBlock({ chain: 1, block_number: 25641950 });

	expect(event.handler(b25641950)).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 25641950,
		    "block_timestamp": 2026-07-30T00:02:23.000Z,
		    "chain": 1,
		    "listing_id": "0xf8ac",
		    "log_index": 16777215,
		    "payout_eth": "0xfccc3b7ccc84000",
		    "purchaser_address": "0x5984bb82F11171cb1DC2287E2A6935c44D491538",
		    "settlement_type": "kept",
		    "success": true,
		    "token_out": "0x0",
		    "tx_index": 69,
		  },
		]
	`);

	const b25642834 = await test_getBlock({ chain: 1, block_number: 25642834 });

	expect(event.handler(b25642834)).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 25642834,
		    "block_timestamp": 2026-07-30T02:59:35.000Z,
		    "chain": 1,
		    "listing_id": "0x176bb",
		    "log_index": 16777215,
		    "payout_eth": "0x14c2dc12e7fc000",
		    "purchaser_address": "0x501435fE524e8515fA6B7E0FCD31FBA6dacB6fC7",
		    "settlement_type": "accepted_fwa",
		    "success": true,
		    "token_out": "0x220f47b1e0e4976daac",
		    "tx_index": 92,
		  },
		  {
		    "block_number": 25642834,
		    "block_timestamp": 2026-07-30T02:59:35.000Z,
		    "chain": 1,
		    "listing_id": "0x16f9b",
		    "log_index": 16777215,
		    "payout_eth": "0x93b8ca29c2c000",
		    "purchaser_address": "0xa89C876BE69223295A0925D7A62Cb6868dEc4ac8",
		    "settlement_type": "relisted",
		    "success": true,
		    "token_out": "0x0",
		    "tx_index": 98,
		  },
		]
	`);

	const b25641960 = await test_getBlock({ chain: 1, block_number: 25641960 });

	expect(event.handler(b25641960)).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 25641960,
		    "block_timestamp": 2026-07-30T00:04:23.000Z,
		    "chain": 1,
		    "listing_id": "0x167bd",
		    "log_index": 16777215,
		    "payout_eth": "0xe8866da08ca000",
		    "purchaser_address": "0xdA3e728C236ed008D00e65370895429087d02B06",
		    "settlement_type": "accepted_eth",
		    "success": true,
		    "token_out": "0x0",
		    "tx_index": 48,
		  },
		]
	`);
});

test.concurrent("intent_fwa_won_v3 uses sentinels for failed settlements", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25642555 });

	expect(event.handler(block)).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 25642555,
		    "block_timestamp": 2026-07-30T02:03:47.000Z,
		    "chain": 1,
		    "listing_id": "0x17804",
		    "log_index": 16777215,
		    "payout_eth": "0x0",
		    "purchaser_address": "0x9ef02557bB81557d5FCE437b4FE59b08C724a5D2",
		    "settlement_type": "accepted_fwa",
		    "success": false,
		    "token_out": "0x0",
		    "tx_index": 121,
		  },
		]
	`);
});
