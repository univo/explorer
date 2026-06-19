import { test } from "vitest";

import { getErc721ApprovalV2 } from "./event";
import { test_deleteEvents, test_getBlock, test_v2_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("erc721_approval_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 13657776 });

	await test_deleteEvents(block, "event_erc721_approval_v2");

	await test_writeEvents(block, "erc721_approval_v2");

	const ids = await test_v2_getEventIdsForBlock(block, "event_erc721_approval_v2");
	const events = await getErc721ApprovalV2(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "id": "619a272e00d066b000bb009900010011",
		    "owner_address": "0x269424e2654dDF7683E71EAADA2ba363FAB37370",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "success": true,
		    "tag": "erc721_approval_v2",
		    "token_address": "0x0b4B2bA334f476C8F41bFe52A428D6891755554d",
		    "token_id": "1243",
		  },
		  {
		    "id": "619a272e00d066b000c400a500010011",
		    "owner_address": "0x8212B16f10746cB5Bfb022aAD72Fa6527e33faD3",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "success": true,
		    "tag": "erc721_approval_v2",
		    "token_address": "0x3cA5b00Ade54365Fbd590D4BC397E044a13068E5",
		    "token_id": "707",
		  },
		  {
		    "id": "619a272e00d066b000c500a700010011",
		    "owner_address": "0x8212B16f10746cB5Bfb022aAD72Fa6527e33faD3",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "success": true,
		    "tag": "erc721_approval_v2",
		    "token_address": "0x3cA5b00Ade54365Fbd590D4BC397E044a13068E5",
		    "token_id": "11",
		  },
		  {
		    "id": "619a272e00d066b000ed00d500010011",
		    "owner_address": "0x91D1B70a8837d4C8dd27325A909D361eA3f44A9A",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "success": true,
		    "tag": "erc721_approval_v2",
		    "token_address": "0x96316355c44Be69414756D6706c61E61aECbD5f3",
		    "token_id": "5939",
		  },
		  {
		    "id": "619a272e00d066b0010d010b00010011",
		    "owner_address": "0x548B388010474279237aa91F359eB6cd86fa8196",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "success": true,
		    "tag": "erc721_approval_v2",
		    "token_address": "0x8943C7bAC1914C9A7ABa750Bf2B6B09Fd21037E0",
		    "token_id": "1578",
		  },
		  {
		    "id": "619a272e00d066b0011a012000010011",
		    "owner_address": "0xCc07E31719b6d430ea1146DaaA25A68ADBfF959c",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "success": true,
		    "tag": "erc721_approval_v2",
		    "token_address": "0x96316355c44Be69414756D6706c61E61aECbD5f3",
		    "token_id": "2148",
		  },
		  {
		    "id": "619a272e00d066b00121012c00010011",
		    "owner_address": "0x2F62c8E5D3fcC4A33b0b5edbE7C07f01511e26bb",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "success": true,
		    "tag": "erc721_approval_v2",
		    "token_address": "0xEB834ae72B30866af20a6ce5440Fa598BfAd3a42",
		    "token_id": "7909",
		  },
		  {
		    "id": "619a272e00d066b00123012f00010011",
		    "owner_address": "0xd7Fc4Ab828AFc1bb4b217f337f1777Ca856Efd12",
		    "spender_address": "0x0000000000000000000000000000000000000000",
		    "success": true,
		    "tag": "erc721_approval_v2",
		    "token_address": "0x01a9f037d4Cd7DA318ab097a47aCD4DEA3ABc083",
		    "token_id": "997",
		  },
		]
	`);
});
