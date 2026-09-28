import { test } from "vitest";

import { isHexEqual } from "@/utils";
import { test_client, test_getBlock } from "@/tests/utils";
import { event, getIntentEnsNameRegisteredV2 } from "./event";

test.concurrent("intent_ens_name_registered_v2 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 18732525 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getIntentEnsNameRegisteredV2(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_ens_name_registered_v2", //
					"intent_ens_name_registered_v2_index_account_v4",
					"intent_ens_name_registered_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const stored = await getIntentEnsNameRegisteredV2(ids);

	expect(stored).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 18732525,
		    "block_timestamp": 2023-12-07T06:06:59.000Z,
		    "chain": 1,
		    "controller_address": "0x253553366Da8546fC250F225fe3d25d0C782303b",
		    "duration": "0x01e13380",
		    "id": "65716103011dd5ed009cffffff00010045",
		    "log_index": 16777215,
		    "name": "payblock",
		    "owner_address": "0xFA929Fc3e365050e539360fb4D4BF971DCf28EdA",
		    "sender_address": "0xFA929Fc3e365050e539360fb4D4BF971DCf28EdA",
		    "success": true,
		    "tag": "intent_ens_name_registered_v2",
		    "tx_index": 156,
		  },
		]
	`);
});

test.concurrent("intent_ens_name_registered_v2 decodes registration submissions", async ({ expect }) => {
	const b23643423 = await test_getBlock({ chain: 1, block_number: 23643423 });

	expect(event.handler(b23643423)).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 23643423,
		    "block_timestamp": 2025-10-23T23:20:35.000Z,
		    "chain": 1,
		    "controller_address": "0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5",
		    "duration": "0x1e13380",
		    "id": "68fab8430168c51f008affffff00010045",
		    "log_index": 16777215,
		    "name": "hangytong",
		    "owner_address": "0xeFb564F5623978F68ff3546b0769ed564A9058EC",
		    "sender_address": "0xeFb564F5623978F68ff3546b0769ed564A9058EC",
		    "success": true,
		    "tag": "intent_ens_name_registered_v2",
		    "tx_index": 138,
		  },
		]
	`);

	const b18732525 = await test_getBlock({ chain: 1, block_number: 18732525 });

	expect(event.handler(b18732525)).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 18732525,
		    "block_timestamp": 2023-12-07T06:06:59.000Z,
		    "chain": 1,
		    "controller_address": "0x253553366Da8546fC250F225fe3d25d0C782303b",
		    "duration": "0x1e13380",
		    "id": "65716103011dd5ed009cffffff00010045",
		    "log_index": 16777215,
		    "name": "payblock",
		    "owner_address": "0xFA929Fc3e365050e539360fb4D4BF971DCf28EdA",
		    "sender_address": "0xFA929Fc3e365050e539360fb4D4BF971DCf28EdA",
		    "success": true,
		    "tag": "intent_ens_name_registered_v2",
		    "tx_index": 156,
		  },
		]
	`);
});

test.concurrent("intent_ens_name_registered_v2 includes failed submissions", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 18732525 });

	const failed = {
		...block,

		eth_getBlockReceipts: block.eth_getBlockReceipts.map((receipt) => {
			if (isHexEqual(receipt.transactionHash, "0xdb20d1ba1883ddf1dd7b411ba8d0852ce0bdd6e0e999484dadc197622e2c3e93")) {
				return { ...receipt, status: "0x0" as const, logs: [] };
			}

			return receipt;
		}),
	};

	expect(event.handler(failed)).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 18732525,
		    "block_timestamp": 2023-12-07T06:06:59.000Z,
		    "chain": 1,
		    "controller_address": "0x253553366Da8546fC250F225fe3d25d0C782303b",
		    "duration": "0x1e13380",
		    "id": "65716103011dd5ed009cffffff00010045",
		    "log_index": 16777215,
		    "name": "payblock",
		    "owner_address": "0xFA929Fc3e365050e539360fb4D4BF971DCf28EdA",
		    "sender_address": "0xFA929Fc3e365050e539360fb4D4BF971DCf28EdA",
		    "success": false,
		    "tag": "intent_ens_name_registered_v2",
		    "tx_index": 156,
		  },
		]
	`);
});
