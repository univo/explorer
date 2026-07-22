import { test } from "vitest";

import { event, getTornadoCashDepositV3 } from "./event";
import { test_getBlock, test_client } from "@/tests/utils";

test.concurrent("tornado_cash_deposit_v3 direct pool deposit", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 9117152 });

	await event.storage.delete(event.handler(block));

	const ids = event.handler(block).map((event) => event.id);
	const initial = await getTornadoCashDepositV3(ids);

	console.log(event.handler(block));

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"tornado_cash_deposit_v3",
					"tornado_cash_deposit_v3_index_account_v3",
					"tornado_cash_deposit_v3_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const events = await getTornadoCashDepositV3(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "from_address": "0x0039F22efB07A647557C7C5d17854CFD6D489eF3",
		    "id": "5df7e219008b1de0000800000000010012",
		    "pool_address": "0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc",
		    "success": true,
		    "tag": "tornado_cash_deposit_v3",
		    "to_address": "0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc",
		  },
		]
	`);
});

test.concurrent("tornado_cash_deposit_v3 proxy deposit", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 11842688 });

	await event.storage.delete(event.handler(block));

	const ids = event.handler(block).map((event) => event.id);
	const initial = await getTornadoCashDepositV3(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"tornado_cash_deposit_v3",
					"tornado_cash_deposit_v3_index_account_v3",
					"tornado_cash_deposit_v3_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const events = await getTornadoCashDepositV3(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "from_address": "0xD2B105c24F7ff289e64e044837f6e308740D10A2",
		    "id": "6026a14300b4b480004500000000010012",
		    "pool_address": "0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936",
		    "success": true,
		    "tag": "tornado_cash_deposit_v3",
		    "to_address": "0x905b63Fff465B9fFBF41DeA908CEb12478ec7601",
		  },
		]
	`);
});
