import { test } from "vitest";

import { event, getErc721TransferV3 } from "./event";
import { test_getBlock, test_client } from "@/tests/utils";

test.concurrent("erc721_transfer_v3", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10000000 });

	await event.storage.delete(event.handler(block));

	const ids = event.handler(block).map((event) => event.id);

	const initial = await getErc721TransferV3(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [{ events: ["erc721_transfer_v3"], blocks: [block] }],
	});

	const events = await getErc721TransferV3(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004100010010",
		    "success": true,
		    "tag": "erc721_transfer_v3",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1f9c",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004200010010",
		    "success": true,
		    "tag": "erc721_transfer_v3",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1f9d",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004300010010",
		    "success": true,
		    "tag": "erc721_transfer_v3",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1fb2",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004400010010",
		    "success": true,
		    "tag": "erc721_transfer_v3",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1fb3",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004500010010",
		    "success": true,
		    "tag": "erc721_transfer_v3",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1fd7",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004600010010",
		    "success": true,
		    "tag": "erc721_transfer_v3",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1fdc",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004700010010",
		    "success": true,
		    "tag": "erc721_transfer_v3",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1fe9",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004800010010",
		    "success": true,
		    "tag": "erc721_transfer_v3",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1ff0",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004900010010",
		    "success": true,
		    "tag": "erc721_transfer_v3",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1ffc",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004a00010010",
		    "success": true,
		    "tag": "erc721_transfer_v3",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x2007",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004b00010010",
		    "success": true,
		    "tag": "erc721_transfer_v3",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x2008",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004c00010010",
		    "success": true,
		    "tag": "erc721_transfer_v3",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x2019",
		  },
		]
	`);
});
