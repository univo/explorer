import { test } from "vitest";

import { event, getErc721ApprovalV3 } from "./event";
import { test_getBlock, test_client } from "@/tests/utils";

test.concurrent("erc721_approval_v3", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 13657776 });

	await event.storage.delete(event.handler(block));

	const ids = event.handler(block).map((event) => event.id);

	const initial = await getErc721ApprovalV3(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [{ events: ["erc721_approval_v3"], blocks: [block] }],
	});

	const events = await getErc721ApprovalV3(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "id": "619a272e00d066b000bb009900010011",
		    "owner_address": "0x269424e2654dDF7683E71EAADA2ba363FAB37370",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "success": true,
		    "tag": "erc721_approval_v3",
		    "token_address": "0x0b4B2bA334f476C8F41bFe52A428D6891755554d",
		    "token_id": "0x04db",
		  },
		  {
		    "id": "619a272e00d066b000c400a500010011",
		    "owner_address": "0x8212B16f10746cB5Bfb022aAD72Fa6527e33faD3",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "success": true,
		    "tag": "erc721_approval_v3",
		    "token_address": "0x3cA5b00Ade54365Fbd590D4BC397E044a13068E5",
		    "token_id": "0x02c3",
		  },
		  {
		    "id": "619a272e00d066b000c500a700010011",
		    "owner_address": "0x8212B16f10746cB5Bfb022aAD72Fa6527e33faD3",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "success": true,
		    "tag": "erc721_approval_v3",
		    "token_address": "0x3cA5b00Ade54365Fbd590D4BC397E044a13068E5",
		    "token_id": "0x0b",
		  },
		  {
		    "id": "619a272e00d066b000ed00d500010011",
		    "owner_address": "0x91D1B70a8837d4C8dd27325A909D361eA3f44A9A",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "success": true,
		    "tag": "erc721_approval_v3",
		    "token_address": "0x96316355c44Be69414756D6706c61E61aECbD5f3",
		    "token_id": "0x1733",
		  },
		  {
		    "id": "619a272e00d066b0010d010b00010011",
		    "owner_address": "0x548B388010474279237aa91F359eB6cd86fa8196",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "success": true,
		    "tag": "erc721_approval_v3",
		    "token_address": "0x8943C7bAC1914C9A7ABa750Bf2B6B09Fd21037E0",
		    "token_id": "0x062a",
		  },
		  {
		    "id": "619a272e00d066b0011a012000010011",
		    "owner_address": "0xCc07E31719b6d430ea1146DaaA25A68ADBfF959c",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "success": true,
		    "tag": "erc721_approval_v3",
		    "token_address": "0x96316355c44Be69414756D6706c61E61aECbD5f3",
		    "token_id": "0x0864",
		  },
		  {
		    "id": "619a272e00d066b00121012c00010011",
		    "owner_address": "0x2F62c8E5D3fcC4A33b0b5edbE7C07f01511e26bb",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "success": true,
		    "tag": "erc721_approval_v3",
		    "token_address": "0xEB834ae72B30866af20a6ce5440Fa598BfAd3a42",
		    "token_id": "0x1ee5",
		  },
		  {
		    "id": "619a272e00d066b00123012f00010011",
		    "owner_address": "0xd7Fc4Ab828AFc1bb4b217f337f1777Ca856Efd12",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "success": true,
		    "tag": "erc721_approval_v3",
		    "token_address": "0x01a9f037d4Cd7DA318ab097a47aCD4DEA3ABc083",
		    "token_id": "0x03e5",
		  },
		]
	`);
});
