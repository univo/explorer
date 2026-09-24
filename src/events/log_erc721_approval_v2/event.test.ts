import { test } from "vitest";

import { event, getLogErc721ApprovalV2 } from "./event";
import { test_getBlock, test_client } from "@/tests/utils";

test.concurrent("log_erc721_approval_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 13657776 });

	await event.storage.delete(event.handler(block));

	const ids = event.handler(block).map((event) => event.id);

	const initial = await getLogErc721ApprovalV2(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"log_erc721_approval_v2", //
					"log_erc721_approval_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const events = await getLogErc721ApprovalV2(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 13657776,
		    "block_timestamp": 2021-11-21T11:02:06.000Z,
		    "chain": 1,
		    "id": "619a272e00d066b000bb00009900010036",
		    "log_index": 153,
		    "owner_address": "0x269424e2654dDF7683E71EAADA2ba363FAB37370",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "tag": "log_erc721_approval_v2",
		    "token_address": "0x0b4B2bA334f476C8F41bFe52A428D6891755554d",
		    "token_id": "0x04db",
		    "tx_index": 187,
		  },
		  {
		    "block_number": 13657776,
		    "block_timestamp": 2021-11-21T11:02:06.000Z,
		    "chain": 1,
		    "id": "619a272e00d066b000c40000a500010036",
		    "log_index": 165,
		    "owner_address": "0x8212B16f10746cB5Bfb022aAD72Fa6527e33faD3",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "tag": "log_erc721_approval_v2",
		    "token_address": "0x3cA5b00Ade54365Fbd590D4BC397E044a13068E5",
		    "token_id": "0x02c3",
		    "tx_index": 196,
		  },
		  {
		    "block_number": 13657776,
		    "block_timestamp": 2021-11-21T11:02:06.000Z,
		    "chain": 1,
		    "id": "619a272e00d066b000c50000a700010036",
		    "log_index": 167,
		    "owner_address": "0x8212B16f10746cB5Bfb022aAD72Fa6527e33faD3",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "tag": "log_erc721_approval_v2",
		    "token_address": "0x3cA5b00Ade54365Fbd590D4BC397E044a13068E5",
		    "token_id": "0x0b",
		    "tx_index": 197,
		  },
		  {
		    "block_number": 13657776,
		    "block_timestamp": 2021-11-21T11:02:06.000Z,
		    "chain": 1,
		    "id": "619a272e00d066b000ed0000d500010036",
		    "log_index": 213,
		    "owner_address": "0x91D1B70a8837d4C8dd27325A909D361eA3f44A9A",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "tag": "log_erc721_approval_v2",
		    "token_address": "0x96316355c44Be69414756D6706c61E61aECbD5f3",
		    "token_id": "0x1733",
		    "tx_index": 237,
		  },
		  {
		    "block_number": 13657776,
		    "block_timestamp": 2021-11-21T11:02:06.000Z,
		    "chain": 1,
		    "id": "619a272e00d066b0010d00010b00010036",
		    "log_index": 267,
		    "owner_address": "0x548B388010474279237aa91F359eB6cd86fa8196",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "tag": "log_erc721_approval_v2",
		    "token_address": "0x8943C7bAC1914C9A7ABa750Bf2B6B09Fd21037E0",
		    "token_id": "0x062a",
		    "tx_index": 269,
		  },
		  {
		    "block_number": 13657776,
		    "block_timestamp": 2021-11-21T11:02:06.000Z,
		    "chain": 1,
		    "id": "619a272e00d066b0011a00012000010036",
		    "log_index": 288,
		    "owner_address": "0xCc07E31719b6d430ea1146DaaA25A68ADBfF959c",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "tag": "log_erc721_approval_v2",
		    "token_address": "0x96316355c44Be69414756D6706c61E61aECbD5f3",
		    "token_id": "0x0864",
		    "tx_index": 282,
		  },
		  {
		    "block_number": 13657776,
		    "block_timestamp": 2021-11-21T11:02:06.000Z,
		    "chain": 1,
		    "id": "619a272e00d066b0012100012c00010036",
		    "log_index": 300,
		    "owner_address": "0x2F62c8E5D3fcC4A33b0b5edbE7C07f01511e26bb",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "tag": "log_erc721_approval_v2",
		    "token_address": "0xEB834ae72B30866af20a6ce5440Fa598BfAd3a42",
		    "token_id": "0x1ee5",
		    "tx_index": 289,
		  },
		  {
		    "block_number": 13657776,
		    "block_timestamp": 2021-11-21T11:02:06.000Z,
		    "chain": 1,
		    "id": "619a272e00d066b0012300012f00010036",
		    "log_index": 303,
		    "owner_address": "0xd7Fc4Ab828AFc1bb4b217f337f1777Ca856Efd12",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "tag": "log_erc721_approval_v2",
		    "token_address": "0x01a9f037d4Cd7DA318ab097a47aCD4DEA3ABc083",
		    "token_id": "0x03e5",
		    "tx_index": 291,
		  },
		]
	`);
});
