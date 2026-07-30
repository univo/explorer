import { test } from "vitest";

import { event, getFwaNftListedV3 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("fwa_nft_listed_v3 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25643505 });

	const events = event.handler(block);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "backing_eth": "0x2b4c77783338000",
		    "collection_address": "0x470879Abd61FdCA91436fE27ed87dB2c8650f3e7",
		    "depositor_address": "0x5b938Ec9b920B6C1Ab351F65581F17Dd2090f579",
		    "id": "6a6add97018749f1001d0000b500010016",
		    "listing_id": "0x17cb6",
		    "slot": "0x1a63",
		    "token_id": "0x89",
		    "weight": "0x472b0b64ca00d20d",
		  },
		  {
		    "backing_eth": "0xb1a2bc2ec50000",
		    "collection_address": "0x942BC2d3e7a589FE5bd4A5C6eF9727DFd82F5C8a",
		    "depositor_address": "0x7303ff5F13568aacE1Ab077E3F52d372E961b279",
		    "id": "6a6add97018749f1001d0000b700010016",
		    "listing_id": "0x17cb7",
		    "slot": "0x2af",
		    "token_id": "0x5826",
		    "weight": "0x1158e460913d00000",
		  },
		  {
		    "backing_eth": "0xb1a2bc2ec50000",
		    "collection_address": "0x26D7Ad0E930b54b84C00DAad077Ee31Ba9e2Fb2E",
		    "depositor_address": "0x7303ff5F13568aacE1Ab077E3F52d372E961b279",
		    "id": "6a6add97018749f1001d0000b900010016",
		    "listing_id": "0x17cb8",
		    "slot": "0x77d",
		    "token_id": "0x15c7",
		    "weight": "0x1158e460913d00000",
		  },
		  {
		    "backing_eth": "0xb1a2bc2ec50000",
		    "collection_address": "0x26D7Ad0E930b54b84C00DAad077Ee31Ba9e2Fb2E",
		    "depositor_address": "0x7303ff5F13568aacE1Ab077E3F52d372E961b279",
		    "id": "6a6add97018749f1001d0000bb00010016",
		    "listing_id": "0x17cb9",
		    "slot": "0x1fd6",
		    "token_id": "0x2034",
		    "weight": "0x1158e460913d00000",
		  },
		  {
		    "backing_eth": "0xb1a2bc2ec50000",
		    "collection_address": "0x26D7Ad0E930b54b84C00DAad077Ee31Ba9e2Fb2E",
		    "depositor_address": "0x7303ff5F13568aacE1Ab077E3F52d372E961b279",
		    "id": "6a6add97018749f1001d0000bd00010016",
		    "listing_id": "0x17cba",
		    "slot": "0x188a",
		    "token_id": "0xa1",
		    "weight": "0x1158e460913d00000",
		  },
		  {
		    "backing_eth": "0xc6f3b40b6c0000",
		    "collection_address": "0x942BC2d3e7a589FE5bd4A5C6eF9727DFd82F5C8a",
		    "depositor_address": "0x9103592D8dd02a193F30f37Ea3A8a29d8982EEB7",
		    "id": "6a6add97018749f1001d0000bf00010016",
		    "listing_id": "0x17cbb",
		    "slot": "0x13a6",
		    "token_id": "0xc2d",
		    "weight": "0xf7d150d13f676db6",
		  },
		  {
		    "backing_eth": "0x2b4c77783338000",
		    "collection_address": "0x470879Abd61FdCA91436fE27ed87dB2c8650f3e7",
		    "depositor_address": "0x5b938Ec9b920B6C1Ab351F65581F17Dd2090f579",
		    "id": "6a6add97018749f1003200013a00010016",
		    "listing_id": "0x17cbc",
		    "slot": "0xda7",
		    "token_id": "0x8a",
		    "weight": "0x472b0b64ca00d20d",
		  },
		  {
		    "backing_eth": "0x234e1a857498000",
		    "collection_address": "0x8fe1a377B83921fe1429aDB1b8fbFECd45De9cd8",
		    "depositor_address": "0x37042ca49d50Ce37557a9d2f54325790841730DB",
		    "id": "6a6add97018749f1003200013c00010016",
		    "listing_id": "0x17cbd",
		    "slot": "0x152c",
		    "token_id": "0x12bf",
		    "weight": "0x57481c76c77019c2",
		  },
		  {
		    "backing_eth": "0xee08251ff38000",
		    "collection_address": "0x942BC2d3e7a589FE5bd4A5C6eF9727DFd82F5C8a",
		    "depositor_address": "0x9103592D8dd02a193F30f37Ea3A8a29d8982EEB7",
		    "id": "6a6add97018749f1003200013e00010016",
		    "listing_id": "0x17cbe",
		    "slot": "0x1091",
		    "token_id": "0x1c4b",
		    "weight": "0xcf2193c9a3cce540",
		  },
		  {
		    "backing_eth": "0xe6ed27d6668000",
		    "collection_address": "0x26D7Ad0E930b54b84C00DAad077Ee31Ba9e2Fb2E",
		    "depositor_address": "0xD092e74d7aba2084cfBf772D29e3d71300e200ec",
		    "id": "6a6add97018749f1003200014000010016",
		    "listing_id": "0x17cbf",
		    "slot": "0x1a20",
		    "token_id": "0xe1a",
		    "weight": "0xd581222e5e027627",
		  },
		  {
		    "backing_eth": "0xc6f3b40b6c0000",
		    "collection_address": "0x942BC2d3e7a589FE5bd4A5C6eF9727DFd82F5C8a",
		    "depositor_address": "0x9103592D8dd02a193F30f37Ea3A8a29d8982EEB7",
		    "id": "6a6add97018749f100af00038200010016",
		    "listing_id": "0x17cc0",
		    "slot": "0x14b2",
		    "token_id": "0x1e71",
		    "weight": "0xf7d150d13f676db6",
		  },
		]
	`);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getFwaNftListedV3(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"fwa_nft_listed_v3", //
					"fwa_nft_listed_v3_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getFwaNftListedV3(ids);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "backing_eth": "0x02b4c77783338000",
		    "collection_address": "0x470879Abd61FdCA91436fE27ed87dB2c8650f3e7",
		    "depositor_address": "0x5b938Ec9b920B6C1Ab351F65581F17Dd2090f579",
		    "id": "6a6add97018749f1001d0000b500010016",
		    "listing_id": "0x017cb6",
		    "slot": "0x1a63",
		    "success": true,
		    "tag": "fwa_nft_listed_v3",
		    "token_id": "0x89",
		    "weight": "0x472b0b64ca00d20d",
		  },
		  {
		    "backing_eth": "0xb1a2bc2ec50000",
		    "collection_address": "0x942BC2d3e7a589FE5bd4A5C6eF9727DFd82F5C8a",
		    "depositor_address": "0x7303ff5F13568aacE1Ab077E3F52d372E961b279",
		    "id": "6a6add97018749f1001d0000b700010016",
		    "listing_id": "0x017cb7",
		    "slot": "0x02af",
		    "success": true,
		    "tag": "fwa_nft_listed_v3",
		    "token_id": "0x5826",
		    "weight": "0x01158e460913d00000",
		  },
		  {
		    "backing_eth": "0xb1a2bc2ec50000",
		    "collection_address": "0x26D7Ad0E930b54b84C00DAad077Ee31Ba9e2Fb2E",
		    "depositor_address": "0x7303ff5F13568aacE1Ab077E3F52d372E961b279",
		    "id": "6a6add97018749f1001d0000b900010016",
		    "listing_id": "0x017cb8",
		    "slot": "0x077d",
		    "success": true,
		    "tag": "fwa_nft_listed_v3",
		    "token_id": "0x15c7",
		    "weight": "0x01158e460913d00000",
		  },
		  {
		    "backing_eth": "0xb1a2bc2ec50000",
		    "collection_address": "0x26D7Ad0E930b54b84C00DAad077Ee31Ba9e2Fb2E",
		    "depositor_address": "0x7303ff5F13568aacE1Ab077E3F52d372E961b279",
		    "id": "6a6add97018749f1001d0000bb00010016",
		    "listing_id": "0x017cb9",
		    "slot": "0x1fd6",
		    "success": true,
		    "tag": "fwa_nft_listed_v3",
		    "token_id": "0x2034",
		    "weight": "0x01158e460913d00000",
		  },
		  {
		    "backing_eth": "0xb1a2bc2ec50000",
		    "collection_address": "0x26D7Ad0E930b54b84C00DAad077Ee31Ba9e2Fb2E",
		    "depositor_address": "0x7303ff5F13568aacE1Ab077E3F52d372E961b279",
		    "id": "6a6add97018749f1001d0000bd00010016",
		    "listing_id": "0x017cba",
		    "slot": "0x188a",
		    "success": true,
		    "tag": "fwa_nft_listed_v3",
		    "token_id": "0xa1",
		    "weight": "0x01158e460913d00000",
		  },
		  {
		    "backing_eth": "0xc6f3b40b6c0000",
		    "collection_address": "0x942BC2d3e7a589FE5bd4A5C6eF9727DFd82F5C8a",
		    "depositor_address": "0x9103592D8dd02a193F30f37Ea3A8a29d8982EEB7",
		    "id": "6a6add97018749f1001d0000bf00010016",
		    "listing_id": "0x017cbb",
		    "slot": "0x13a6",
		    "success": true,
		    "tag": "fwa_nft_listed_v3",
		    "token_id": "0x0c2d",
		    "weight": "0xf7d150d13f676db6",
		  },
		  {
		    "backing_eth": "0x02b4c77783338000",
		    "collection_address": "0x470879Abd61FdCA91436fE27ed87dB2c8650f3e7",
		    "depositor_address": "0x5b938Ec9b920B6C1Ab351F65581F17Dd2090f579",
		    "id": "6a6add97018749f1003200013a00010016",
		    "listing_id": "0x017cbc",
		    "slot": "0x0da7",
		    "success": true,
		    "tag": "fwa_nft_listed_v3",
		    "token_id": "0x8a",
		    "weight": "0x472b0b64ca00d20d",
		  },
		  {
		    "backing_eth": "0x0234e1a857498000",
		    "collection_address": "0x8fe1a377B83921fe1429aDB1b8fbFECd45De9cd8",
		    "depositor_address": "0x37042ca49d50Ce37557a9d2f54325790841730DB",
		    "id": "6a6add97018749f1003200013c00010016",
		    "listing_id": "0x017cbd",
		    "slot": "0x152c",
		    "success": true,
		    "tag": "fwa_nft_listed_v3",
		    "token_id": "0x12bf",
		    "weight": "0x57481c76c77019c2",
		  },
		  {
		    "backing_eth": "0xee08251ff38000",
		    "collection_address": "0x942BC2d3e7a589FE5bd4A5C6eF9727DFd82F5C8a",
		    "depositor_address": "0x9103592D8dd02a193F30f37Ea3A8a29d8982EEB7",
		    "id": "6a6add97018749f1003200013e00010016",
		    "listing_id": "0x017cbe",
		    "slot": "0x1091",
		    "success": true,
		    "tag": "fwa_nft_listed_v3",
		    "token_id": "0x1c4b",
		    "weight": "0xcf2193c9a3cce540",
		  },
		  {
		    "backing_eth": "0xe6ed27d6668000",
		    "collection_address": "0x26D7Ad0E930b54b84C00DAad077Ee31Ba9e2Fb2E",
		    "depositor_address": "0xD092e74d7aba2084cfBf772D29e3d71300e200ec",
		    "id": "6a6add97018749f1003200014000010016",
		    "listing_id": "0x017cbf",
		    "slot": "0x1a20",
		    "success": true,
		    "tag": "fwa_nft_listed_v3",
		    "token_id": "0x0e1a",
		    "weight": "0xd581222e5e027627",
		  },
		  {
		    "backing_eth": "0xc6f3b40b6c0000",
		    "collection_address": "0x942BC2d3e7a589FE5bd4A5C6eF9727DFd82F5C8a",
		    "depositor_address": "0x9103592D8dd02a193F30f37Ea3A8a29d8982EEB7",
		    "id": "6a6add97018749f100af00038200010016",
		    "listing_id": "0x017cc0",
		    "slot": "0x14b2",
		    "success": true,
		    "tag": "fwa_nft_listed_v3",
		    "token_id": "0x1e71",
		    "weight": "0xf7d150d13f676db6",
		  },
		]
	`);
});
