import { test } from "vitest";

import { event, getFwaWonV3 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("fwa_won_v3 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25641950 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getFwaWonV3(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: ["fwa_won_v3", "fwa_won_v3_index_account_v3", "fwa_won_v3_index_block_number_tx_index_v4"],
			},
		],
	});

	const final = await getFwaWonV3(ids);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "depositor_address": "0xC694108e704b3AC3C5b099A4B06208Bd0695aD00",
		    "id": "6a6a948f018743de0045ffffff00010015",
		    "listing_id": "0xf8ac",
		    "payout_eth": "0x0fccc3b7ccc84000",
		    "purchaser_address": "0x5984bb82F11171cb1DC2287E2A6935c44D491538",
		    "retained_eth": "0x00",
		    "settlement_type": "kept",
		    "success": true,
		    "tag": "fwa_won_v3",
		    "token_out": "0x00",
		  },
		]
	`);
});

test.concurrent("fwa_won_v3 handles all settlement types", async ({ expect }) => {
	const b25641950 = await test_getBlock({ chain: 1, block_number: 25641950 });

	expect(event.handler(b25641950)).toMatchInlineSnapshot(`
		[
		  {
		    "depositor_address": "0xC694108e704b3AC3C5b099A4B06208Bd0695aD00",
		    "id": "6a6a948f018743de0045ffffff00010015",
		    "listing_id": "0xf8ac",
		    "payout_eth": "0xfccc3b7ccc84000",
		    "purchaser_address": "0x5984bb82F11171cb1DC2287E2A6935c44D491538",
		    "retained_eth": "0x0",
		    "settlement_type": "kept",
		    "success": true,
		    "token_out": "0x0",
		  },
		]
	`);

	const b25642834 = await test_getBlock({ chain: 1, block_number: 25642834 });

	expect(event.handler(b25642834)).toMatchInlineSnapshot(`
		[
		  {
		    "depositor_address": "0x825540AD71A7cCE2655C1Bf80956c332C90c7aD9",
		    "id": "6a6abe1701874752005cffffff00010015",
		    "listing_id": "0x176bb",
		    "payout_eth": "0x14c2dc12e7fc000",
		    "purchaser_address": "0x501435fE524e8515fA6B7E0FCD31FBA6dacB6fC7",
		    "retained_eth": "0x3a9ea99ecb4000",
		    "settlement_type": "accepted_fwa",
		    "success": true,
		    "token_out": "0x220f47b1e0e4976daac",
		  },
		  {
		    "depositor_address": "0x0000000000000000000000000000000000000000",
		    "id": "6a6abe17018747520062ffffff00010015",
		    "listing_id": "0x16f9b",
		    "payout_eth": "0x93b8ca29c2c000",
		    "purchaser_address": "0xa89C876BE69223295A0925D7A62Cb6868dEc4ac8",
		    "retained_eth": "0x0",
		    "settlement_type": "relisted",
		    "success": true,
		    "token_out": "0x0",
		  },
		]
	`);

	const b25641960 = await test_getBlock({ chain: 1, block_number: 25641960 });

	expect(event.handler(b25641960)).toMatchInlineSnapshot(`
		[
		  {
		    "depositor_address": "0x5b938Ec9b920B6C1Ab351F65581F17Dd2090f579",
		    "id": "6a6a9507018743e80030ffffff00010015",
		    "listing_id": "0x167bd",
		    "payout_eth": "0xe8866da08ca000",
		    "purchaser_address": "0xdA3e728C236ed008D00e65370895429087d02B06",
		    "retained_eth": "0x2908a9ef27e000",
		    "settlement_type": "accepted_eth",
		    "success": true,
		    "token_out": "0x0",
		  },
		]
	`);
});

test.concurrent("fwa_won_v3 uses sentinels for failed settlements", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25642555 });

	expect(event.handler(block)).toMatchInlineSnapshot(`
		[
		  {
		    "depositor_address": "0x0000000000000000000000000000000000000000",
		    "id": "6a6ab1030187463b0079ffffff00010015",
		    "listing_id": "0x17804",
		    "payout_eth": "0x0",
		    "purchaser_address": "0x9ef02557bB81557d5FCE437b4FE59b08C724a5D2",
		    "retained_eth": "0x0",
		    "settlement_type": "accepted_fwa",
		    "success": false,
		    "token_out": "0x0",
		  },
		]
	`);
});
