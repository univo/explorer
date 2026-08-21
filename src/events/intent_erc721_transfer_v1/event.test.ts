import { test } from "vitest";

import { event, getIntentErc721TransferV1 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_erc721_transfer_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25798225 });

	const handled = event.handler(block);

	expect(handled).toHaveLength(3);

	await event.storage.delete(handled);

	const ids = handled.map((event) => event.id);

	expect(await getIntentErc721TransferV1(ids)).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_erc721_transfer_v1", //
					"intent_erc721_transfer_v1_index_account_v3",
					"intent_erc721_transfer_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const stored = await getIntentErc721TransferV1(ids);

	expect(stored).toMatchInlineSnapshot(`
		[
		  {
		    "caller_address": "0x0866584736ebcAC48E958C8BDaC9DFA43E6138b3",
		    "from_address": "0x0866584736ebcAC48E958C8BDaC9DFA43E6138b3",
		    "id": "6a874beb0189a6510036ffffff0001002f",
		    "success": true,
		    "tag": "intent_erc721_transfer_v1",
		    "to_address": "0x49aF38C4A68e7724bA2369703f77153Dc8fb1e5F",
		    "token_address": "0xA2a6063B910fC7A7a286196F6c9b62B2797fa0Ae",
		    "token_id": "0x26ce",
		  },
		  {
		    "caller_address": "0x0c000806d0158095b1E332415C2C65C063571a93",
		    "from_address": "0x0c000806d0158095b1E332415C2C65C063571a93",
		    "id": "6a874beb0189a6510065ffffff0001002f",
		    "success": true,
		    "tag": "intent_erc721_transfer_v1",
		    "to_address": "0xb4acbC082b5e7dEd571c98EE4257778a9D784B36",
		    "token_address": "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
		    "token_id": "0x148b4d",
		  },
		  {
		    "caller_address": "0xD1323a3AA1D2c39801AcB0d3F65201bEda710aD7",
		    "from_address": "0xD1323a3AA1D2c39801AcB0d3F65201bEda710aD7",
		    "id": "6a874beb0189a65100adffffff0001002f",
		    "success": true,
		    "tag": "intent_erc721_transfer_v1",
		    "to_address": "0x793411DC3883a0EEDbf0A8D10451ACd8c0535354",
		    "token_address": "0xf299F7bD0b275eFbBd53C08C95f595b58842CC2E",
		    "token_id": "0x9d",
		  },
		]
	`);
});
