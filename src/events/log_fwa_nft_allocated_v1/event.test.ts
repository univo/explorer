import { test } from "vitest";

import { event, getLogFwaNftAllocatedV1 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("log_fwa_nft_allocated_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25642809 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getLogFwaNftAllocatedV1(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"log_fwa_nft_allocated_v1", //
					"log_fwa_nft_allocated_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getLogFwaNftAllocatedV1(ids);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "backing_eth": "0x9536c708910000",
		    "depositor_address": "0x03594D72e895e4ecD716e472C84815233047e566",
		    "id": "6a6abceb0187473900df0004d100010032",
		    "listing_id": "0x16f9b",
		    "purchaser_address": "0xa89C876BE69223295A0925D7A62Cb6868dEc4ac8",
		    "random_word": "0x6632556397fd016bfc2f9cbfcee7a0b3b1fa3f7c1c8c53595cda37c12212f897",
		    "request_id": "0x41e79149df895a3da1316eb7d00426b7b11912e69c12e99fb2e73a577db67655",
		    "success": true,
		    "tag": "log_fwa_nft_allocated_v1",
		  },
		]
	`);
});
