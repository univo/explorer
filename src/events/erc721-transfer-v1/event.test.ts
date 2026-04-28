import { test } from "vitest";

import { getErc721TransferV1 } from "./event";
import { test_deleteEvents, test_getBlock, test_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("erc721_transfer_v1", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10000000 });

	await test_deleteEvents(block, "event_erc721_transfer_v1");

	const response = await test_writeEvents(block, "erc721_transfer_v1");

	expect(response.error).toBeUndefined();
	expect(response.result).toMatchObject({ failures: [] });

	const ids = await test_getEventIdsForBlock(block, "event_erc721_transfer_v1");

	const events = await getErc721TransferV1(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705-0098-9680-0026-004100010007",
		    "success": true,
		    "tag": "erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8092",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705-0098-9680-0026-004200010007",
		    "success": true,
		    "tag": "erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8093",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705-0098-9680-0026-004300010007",
		    "success": true,
		    "tag": "erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8114",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705-0098-9680-0026-004400010007",
		    "success": true,
		    "tag": "erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8115",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705-0098-9680-0026-004500010007",
		    "success": true,
		    "tag": "erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8151",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705-0098-9680-0026-004600010007",
		    "success": true,
		    "tag": "erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8156",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705-0098-9680-0026-004700010007",
		    "success": true,
		    "tag": "erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8169",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705-0098-9680-0026-004800010007",
		    "success": true,
		    "tag": "erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8176",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705-0098-9680-0026-004900010007",
		    "success": true,
		    "tag": "erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8188",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705-0098-9680-0026-004a00010007",
		    "success": true,
		    "tag": "erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8199",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705-0098-9680-0026-004b00010007",
		    "success": true,
		    "tag": "erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8200",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb01705-0098-9680-0026-004c00010007",
		    "success": true,
		    "tag": "erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "8217",
		  },
		]
	`);
});
