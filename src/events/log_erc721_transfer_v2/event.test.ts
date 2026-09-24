import { test } from "vitest";

import { event, getLogErc721TransferV2 } from "./event";
import { test_getBlock, test_client } from "@/tests/utils";

test.concurrent("log_erc721_transfer_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10000000 });

	await event.storage.delete(event.handler(block));

	const ids = event.handler(block).map((event) => event.id);

	const initial = await getLogErc721TransferV2(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"log_erc721_transfer_v2", //
					"log_erc721_transfer_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const events = await getLogErc721TransferV2(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004100010037",
		    "log_index": 65,
		    "tag": "log_erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1f9c",
		    "tx_index": 38,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004200010037",
		    "log_index": 66,
		    "tag": "log_erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1f9d",
		    "tx_index": 38,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004300010037",
		    "log_index": 67,
		    "tag": "log_erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1fb2",
		    "tx_index": 38,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004400010037",
		    "log_index": 68,
		    "tag": "log_erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1fb3",
		    "tx_index": 38,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004500010037",
		    "log_index": 69,
		    "tag": "log_erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1fd7",
		    "tx_index": 38,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004600010037",
		    "log_index": 70,
		    "tag": "log_erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1fdc",
		    "tx_index": 38,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004700010037",
		    "log_index": 71,
		    "tag": "log_erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1fe9",
		    "tx_index": 38,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004800010037",
		    "log_index": 72,
		    "tag": "log_erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1ff0",
		    "tx_index": 38,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004900010037",
		    "log_index": 73,
		    "tag": "log_erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x1ffc",
		    "tx_index": 38,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004a00010037",
		    "log_index": 74,
		    "tag": "log_erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x2007",
		    "tx_index": 38,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004b00010037",
		    "log_index": 75,
		    "tag": "log_erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x2008",
		    "tx_index": 38,
		  },
		  {
		    "block_number": 10000000,
		    "block_timestamp": 2020-05-04T13:22:13.000Z,
		    "chain": 1,
		    "from_address": "0xA6fA96567abC0ea45E6683A0B29Ca575fdf8Af85",
		    "id": "5eb0170500989680002600004c00010037",
		    "log_index": 76,
		    "tag": "log_erc721_transfer_v2",
		    "to_address": "0x074fdC302F8D3C0E8B11C80F2A07BF2a3b8ca855",
		    "token_address": "0x2594d80da5f2e4f742D1E479eb9408aAD132D0Bd",
		    "token_id": "0x2019",
		    "tx_index": 38,
		  },
		]
	`);
});
