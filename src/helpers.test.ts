import { numberToHex } from "viem";
import { expect, test } from "vitest";
import {
	createId,
	formatTokenAmount,
	parseId,
	v2_createId,
	v2_getPartition,
	v2_getPartitions,
	v2_parseId,
} from "@/helpers";

test.concurrent("creates and parses valid ids", () => {
	const id = createId({
		block_timestamp: numberToHex(1763680847),
		block_number: numberToHex(23843479),
		tx_index: numberToHex(210),
		log_index: numberToHex(754),
		chain_id: numberToHex(1),
		table_id: 5,
	});

	expect(id).toBe("691fa24f-016b-d297-00d2-02f200010005");

	expect(parseId(id)).toMatchObject({
		block_timestamp: 1763680847,
		block_number: 23843479,
		tx_index: 210,
		log_index: 754,
		chain_id: 1,
		table_id: 5,
	});
});

test.concurrent("creates and parses version two ids", () => {
	const id = v2_createId({
		blockTimestamp: numberToHex(1763680847),
		blockNumber: numberToHex(23843479),
		txIndex: numberToHex(210),
		logIndex: numberToHex(754),
		chainId: numberToHex(1),
		tableId: 5,
	});

	expect(id).toBe("691fa24f016bd29700d202f200010005");

	expect(v2_parseId(id)).toMatchObject({
		blockTimestamp: 1763680847,
		blockNumber: 23843479,
		txIndex: 210,
		logIndex: 754,
		chainId: 1,
		tableId: 5,
	});
});

test.concurrent("formats token amounts", () => {
	expect(formatTokenAmount("12", 18)).toBe("0.000000000000000012");
	expect(formatTokenAmount("125", 18)).toBe("0.00000000000000013");
});

test.concurrent("derives the correct partition from an id", () => {
	expect(v2_getPartition("0x5eb01705")).toEqual(20200404);
	expect(v2_getPartition("0x6a153133")).toEqual(20260426);
});

test.concurrent("groups partitions in a SQL clause", () => {
	const ids = [
		"5eb0170500989680001b002b00010002", //
		"6a15313301802d5b0011004b00010002",
	];

	expect(v2_getPartitions(ids)).toMatchObject([
		"(partition = 20200404 AND id IN (unhex('5eb0170500989680001b002b00010002')))",
		"(partition = 20260426 AND id IN (unhex('6a15313301802d5b0011004b00010002')))",
	]);
});
