import { test } from "vitest";

import { test_getBlock } from "@/tests/utils";
import { event as erc20_transfer_v3 } from "@/events/log_erc20_transfer_v1/event";
import { event as native_transfer_v3 } from "@/events/intent_native_transfer_v1/event";
import {
	getEventIdsForBlockNumber,
	getEventIdsForTxPosition,
	index_block_number_tx_index_v4,
} from "./block-number-tx-index-v4";

test.concurrent("native_transfer_v3", async ({ expect }) => {
	const block_number = 10000000;

	const block = await test_getBlock({ chain: 1, block_number });

	const indexes = native_transfer_v3.handler(block).map((event) => {
		return event.id;
	});

	await index_block_number_tx_index_v4.delete(indexes);

	await index_block_number_tx_index_v4.upsert(indexes);

	const ids = await getEventIdsForBlockNumber(1, block_number);

	expect(ids).toMatchInlineSnapshot(`
		[
		  "5eb01705009896800000ffffff0001000a",
		  "5eb01705009896800001ffffff0001000a",
		  "5eb01705009896800002ffffff0001000a",
		  "5eb01705009896800003ffffff0001000a",
		  "5eb01705009896800004ffffff0001000a",
		  "5eb01705009896800008ffffff0001000a",
		  "5eb01705009896800009ffffff0001000a",
		  "5eb0170500989680000affffff0001000a",
		  "5eb0170500989680000fffffff0001000a",
		  "5eb01705009896800010ffffff0001000a",
		  "5eb01705009896800013ffffff0001000a",
		  "5eb01705009896800017ffffff0001000a",
		  "5eb01705009896800023ffffff0001000a",
		  "5eb01705009896800025ffffff0001000a",
		  "5eb01705009896800027ffffff0001000a",
		  "5eb01705009896800028ffffff0001000a",
		  "5eb01705009896800029ffffff0001000a",
		  "5eb0170500989680002affffff0001000a",
		  "5eb0170500989680002cffffff0001000a",
		  "5eb0170500989680002dffffff0001000a",
		  "5eb0170500989680002fffffff0001000a",
		  "5eb01705009896800030ffffff0001000a",
		  "5eb01705009896800036ffffff0001000a",
		  "5eb01705009896800037ffffff0001000a",
		  "5eb01705009896800047ffffff0001000a",
		  "5eb01705009896800048ffffff0001000a",
		  "5eb0170500989680004cffffff0001000a",
		  "5eb0170500989680004dffffff0001000a",
		  "5eb0170500989680005fffffff0001000a",
		  "5eb01705009896800062ffffff0001000a",
		  "5eb01705009896800066ffffff0001000a",
		]
	`);
});

test.concurrent("erc20_transfer_v3", async ({ expect }) => {
	const block_number = 20000000;

	const block = await test_getBlock({ chain: 1, block_number });

	const indexes = erc20_transfer_v3.handler(block).map((event) => {
		return event.id;
	});

	await index_block_number_tx_index_v4.delete(indexes);

	await index_block_number_tx_index_v4.upsert(indexes);

	const ids = await getEventIdsForTxPosition(1, block_number, 0);

	expect(ids).toMatchInlineSnapshot(`
		[
		  "665ba27f01312d00000000000000010009",
		  "665ba27f01312d00000000000100010009",
		  "665ba27f01312d00000000000400010009",
		  "665ba27f01312d00000000000500010009",
		  "665ba27f01312d00000000000800010009",
		  "665ba27f01312d00000000000900010009",
		  "665ba27f01312d00000000000c00010009",
		  "665ba27f01312d00000000000d00010009",
		]
	`);
});
