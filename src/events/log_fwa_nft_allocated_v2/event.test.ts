import { test } from "vitest";

import { event, getLogFwaNftAllocatedV2 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("log_fwa_nft_allocated_v2 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25642809 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getLogFwaNftAllocatedV2(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"log_fwa_nft_allocated_v2", //
					"log_fwa_nft_allocated_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getLogFwaNftAllocatedV2(ids);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "backing_eth": "0x9536c708910000",
		    "block_number": 25642809,
		    "block_timestamp": 2026-07-30T02:54:35.000Z,
		    "chain": 1,
		    "depositor_address": "0x03594D72e895e4ecD716e472C84815233047e566",
		    "id": "6a6abceb0187473900df0004d10001003d",
		    "listing_id": "0x016f9b",
		    "log_index": 1233,
		    "purchaser_address": "0xa89C876BE69223295A0925D7A62Cb6868dEc4ac8",
		    "tag": "log_fwa_nft_allocated_v2",
		    "tx_index": 223,
		  },
		]
	`);
});
