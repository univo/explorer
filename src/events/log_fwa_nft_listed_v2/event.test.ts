import { test } from "vitest";

import { test_client, test_getBlock } from "@/tests/utils";
import { event, getFwaListingById, getLogFwaNftListedV2 } from "./event";

test.concurrent("log_fwa_nft_listed_v2 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25643505 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getLogFwaNftListedV2(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"log_fwa_nft_listed_v2", //
					"log_fwa_nft_listed_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getLogFwaNftListedV2(ids);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "backing_eth": "0x02b4c77783338000",
		    "block_number": 25643505,
		    "block_timestamp": 2026-07-30T05:13:59.000Z,
		    "chain": 1,
		    "collection_address": "0x470879Abd61FdCA91436fE27ed87dB2c8650f3e7",
		    "depositor_address": "0x5b938Ec9b920B6C1Ab351F65581F17Dd2090f579",
		    "id": "6a6add97018749f1001d0000b50001003c",
		    "listing_id": "0x017cb6",
		    "log_index": 181,
		    "slot": "0x1a63",
		    "tag": "log_fwa_nft_listed_v2",
		    "token_id": "0x89",
		    "tx_index": 29,
		    "weight": "0x472b0b64ca00d20d",
		  },
		  {
		    "backing_eth": "0xb1a2bc2ec50000",
		    "block_number": 25643505,
		    "block_timestamp": 2026-07-30T05:13:59.000Z,
		    "chain": 1,
		    "collection_address": "0x942BC2d3e7a589FE5bd4A5C6eF9727DFd82F5C8a",
		    "depositor_address": "0x7303ff5F13568aacE1Ab077E3F52d372E961b279",
		    "id": "6a6add97018749f1001d0000b70001003c",
		    "listing_id": "0x017cb7",
		    "log_index": 183,
		    "slot": "0x02af",
		    "tag": "log_fwa_nft_listed_v2",
		    "token_id": "0x5826",
		    "tx_index": 29,
		    "weight": "0x01158e460913d00000",
		  },
		  {
		    "backing_eth": "0xb1a2bc2ec50000",
		    "block_number": 25643505,
		    "block_timestamp": 2026-07-30T05:13:59.000Z,
		    "chain": 1,
		    "collection_address": "0x26D7Ad0E930b54b84C00DAad077Ee31Ba9e2Fb2E",
		    "depositor_address": "0x7303ff5F13568aacE1Ab077E3F52d372E961b279",
		    "id": "6a6add97018749f1001d0000b90001003c",
		    "listing_id": "0x017cb8",
		    "log_index": 185,
		    "slot": "0x077d",
		    "tag": "log_fwa_nft_listed_v2",
		    "token_id": "0x15c7",
		    "tx_index": 29,
		    "weight": "0x01158e460913d00000",
		  },
		  {
		    "backing_eth": "0xb1a2bc2ec50000",
		    "block_number": 25643505,
		    "block_timestamp": 2026-07-30T05:13:59.000Z,
		    "chain": 1,
		    "collection_address": "0x26D7Ad0E930b54b84C00DAad077Ee31Ba9e2Fb2E",
		    "depositor_address": "0x7303ff5F13568aacE1Ab077E3F52d372E961b279",
		    "id": "6a6add97018749f1001d0000bb0001003c",
		    "listing_id": "0x017cb9",
		    "log_index": 187,
		    "slot": "0x1fd6",
		    "tag": "log_fwa_nft_listed_v2",
		    "token_id": "0x2034",
		    "tx_index": 29,
		    "weight": "0x01158e460913d00000",
		  },
		  {
		    "backing_eth": "0xb1a2bc2ec50000",
		    "block_number": 25643505,
		    "block_timestamp": 2026-07-30T05:13:59.000Z,
		    "chain": 1,
		    "collection_address": "0x26D7Ad0E930b54b84C00DAad077Ee31Ba9e2Fb2E",
		    "depositor_address": "0x7303ff5F13568aacE1Ab077E3F52d372E961b279",
		    "id": "6a6add97018749f1001d0000bd0001003c",
		    "listing_id": "0x017cba",
		    "log_index": 189,
		    "slot": "0x188a",
		    "tag": "log_fwa_nft_listed_v2",
		    "token_id": "0xa1",
		    "tx_index": 29,
		    "weight": "0x01158e460913d00000",
		  },
		  {
		    "backing_eth": "0xc6f3b40b6c0000",
		    "block_number": 25643505,
		    "block_timestamp": 2026-07-30T05:13:59.000Z,
		    "chain": 1,
		    "collection_address": "0x942BC2d3e7a589FE5bd4A5C6eF9727DFd82F5C8a",
		    "depositor_address": "0x9103592D8dd02a193F30f37Ea3A8a29d8982EEB7",
		    "id": "6a6add97018749f1001d0000bf0001003c",
		    "listing_id": "0x017cbb",
		    "log_index": 191,
		    "slot": "0x13a6",
		    "tag": "log_fwa_nft_listed_v2",
		    "token_id": "0x0c2d",
		    "tx_index": 29,
		    "weight": "0xf7d150d13f676db6",
		  },
		  {
		    "backing_eth": "0x02b4c77783338000",
		    "block_number": 25643505,
		    "block_timestamp": 2026-07-30T05:13:59.000Z,
		    "chain": 1,
		    "collection_address": "0x470879Abd61FdCA91436fE27ed87dB2c8650f3e7",
		    "depositor_address": "0x5b938Ec9b920B6C1Ab351F65581F17Dd2090f579",
		    "id": "6a6add97018749f1003200013a0001003c",
		    "listing_id": "0x017cbc",
		    "log_index": 314,
		    "slot": "0x0da7",
		    "tag": "log_fwa_nft_listed_v2",
		    "token_id": "0x8a",
		    "tx_index": 50,
		    "weight": "0x472b0b64ca00d20d",
		  },
		  {
		    "backing_eth": "0x0234e1a857498000",
		    "block_number": 25643505,
		    "block_timestamp": 2026-07-30T05:13:59.000Z,
		    "chain": 1,
		    "collection_address": "0x8fe1a377B83921fe1429aDB1b8fbFECd45De9cd8",
		    "depositor_address": "0x37042ca49d50Ce37557a9d2f54325790841730DB",
		    "id": "6a6add97018749f1003200013c0001003c",
		    "listing_id": "0x017cbd",
		    "log_index": 316,
		    "slot": "0x152c",
		    "tag": "log_fwa_nft_listed_v2",
		    "token_id": "0x12bf",
		    "tx_index": 50,
		    "weight": "0x57481c76c77019c2",
		  },
		  {
		    "backing_eth": "0xee08251ff38000",
		    "block_number": 25643505,
		    "block_timestamp": 2026-07-30T05:13:59.000Z,
		    "chain": 1,
		    "collection_address": "0x942BC2d3e7a589FE5bd4A5C6eF9727DFd82F5C8a",
		    "depositor_address": "0x9103592D8dd02a193F30f37Ea3A8a29d8982EEB7",
		    "id": "6a6add97018749f1003200013e0001003c",
		    "listing_id": "0x017cbe",
		    "log_index": 318,
		    "slot": "0x1091",
		    "tag": "log_fwa_nft_listed_v2",
		    "token_id": "0x1c4b",
		    "tx_index": 50,
		    "weight": "0xcf2193c9a3cce540",
		  },
		  {
		    "backing_eth": "0xe6ed27d6668000",
		    "block_number": 25643505,
		    "block_timestamp": 2026-07-30T05:13:59.000Z,
		    "chain": 1,
		    "collection_address": "0x26D7Ad0E930b54b84C00DAad077Ee31Ba9e2Fb2E",
		    "depositor_address": "0xD092e74d7aba2084cfBf772D29e3d71300e200ec",
		    "id": "6a6add97018749f100320001400001003c",
		    "listing_id": "0x017cbf",
		    "log_index": 320,
		    "slot": "0x1a20",
		    "tag": "log_fwa_nft_listed_v2",
		    "token_id": "0x0e1a",
		    "tx_index": 50,
		    "weight": "0xd581222e5e027627",
		  },
		  {
		    "backing_eth": "0xc6f3b40b6c0000",
		    "block_number": 25643505,
		    "block_timestamp": 2026-07-30T05:13:59.000Z,
		    "chain": 1,
		    "collection_address": "0x942BC2d3e7a589FE5bd4A5C6eF9727DFd82F5C8a",
		    "depositor_address": "0x9103592D8dd02a193F30f37Ea3A8a29d8982EEB7",
		    "id": "6a6add97018749f100af0003820001003c",
		    "listing_id": "0x017cc0",
		    "log_index": 898,
		    "slot": "0x14b2",
		    "tag": "log_fwa_nft_listed_v2",
		    "token_id": "0x1e71",
		    "tx_index": 175,
		    "weight": "0xf7d150d13f676db6",
		  },
		]
	`);

	const listing = await getFwaListingById("0x017cb6");

	expect(listing).toMatchObject({
		backing_eth: "0x02b4c77783338000",
		block_number: 25643505,
		block_timestamp: new Date("2026-07-30T05:13:59.000Z"),
		chain: 1,
		collection_address: "0x470879Abd61FdCA91436fE27ed87dB2c8650f3e7",
		depositor_address: "0x5b938Ec9b920B6C1Ab351F65581F17Dd2090f579",
		id: "6a6add97018749f1001d0000b50001003c",
		listing_id: "0x017cb6",
		log_index: 181,
		slot: "0x1a63",
		tag: "log_fwa_nft_listed_v2",
		token_id: "0x89",
		tx_index: 29,
		weight: "0x472b0b64ca00d20d",
	});
});
