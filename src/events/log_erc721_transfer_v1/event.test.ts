import { test } from "vitest";

import { event, getLogErc721TransferV1 } from "./event";
import { test_getBlock, test_client } from "@/tests/utils";

test.concurrent("log_erc721_transfer_v1", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10000000 });

	await event.storage.delete(event.handler(block));

	const ids = event.handler(block).map((event) => event.id);

	const initial = await getLogErc721TransferV1(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"log_erc721_transfer_v1", //
					"log_erc721_transfer_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const events = await getLogErc721TransferV1(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004100010026",
		    "success": true,
		    "tag": "log_erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1f9c",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004200010026",
		    "success": true,
		    "tag": "log_erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1f9d",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004300010026",
		    "success": true,
		    "tag": "log_erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1fb2",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004400010026",
		    "success": true,
		    "tag": "log_erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1fb3",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004500010026",
		    "success": true,
		    "tag": "log_erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1fd7",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004600010026",
		    "success": true,
		    "tag": "log_erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1fdc",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004700010026",
		    "success": true,
		    "tag": "log_erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1fe9",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004800010026",
		    "success": true,
		    "tag": "log_erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1ff0",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004900010026",
		    "success": true,
		    "tag": "log_erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1ffc",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004a00010026",
		    "success": true,
		    "tag": "log_erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x2007",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004b00010026",
		    "success": true,
		    "tag": "log_erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x2008",
		  },
		  {
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004c00010026",
		    "success": true,
		    "tag": "log_erc721_transfer_v1",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x2019",
		  },
		]
	`);
});
