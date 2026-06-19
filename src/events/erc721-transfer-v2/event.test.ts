import { test } from "vitest";

import { getErc721TransferV2 } from "./event";
import { test_v2_deleteEvents, test_getBlock, test_v2_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("erc721_transfer_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10000000 });

	await test_v2_deleteEvents(block, "event_erc721_transfer_v2");

	await test_writeEvents(block, "erc721_transfer_v2");

	const ids = await test_v2_getEventIdsForBlock(block, "event_erc721_transfer_v2");
	const events = await getErc721TransferV2(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705009896800026004100010010",
		    "success": true,
		    "tag": "erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8092",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705009896800026004200010010",
		    "success": true,
		    "tag": "erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8093",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705009896800026004300010010",
		    "success": true,
		    "tag": "erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8114",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705009896800026004400010010",
		    "success": true,
		    "tag": "erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8115",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705009896800026004500010010",
		    "success": true,
		    "tag": "erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8151",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705009896800026004600010010",
		    "success": true,
		    "tag": "erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8156",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705009896800026004700010010",
		    "success": true,
		    "tag": "erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8169",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705009896800026004800010010",
		    "success": true,
		    "tag": "erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8176",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705009896800026004900010010",
		    "success": true,
		    "tag": "erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8188",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705009896800026004a00010010",
		    "success": true,
		    "tag": "erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8199",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705009896800026004b00010010",
		    "success": true,
		    "tag": "erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8200",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705009896800026004c00010010",
		    "success": true,
		    "tag": "erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8217",
		  },
		]
	`);
});
