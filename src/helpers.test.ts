import { numberToHex } from "viem";
import { expect, test } from "vitest";
import { formatTokenAmount, parseId, createId, getPartition, getPartitions } from "@/helpers";

test.concurrent("creates and parses ids", () => {
	const id = createId({
		blockTimestamp: numberToHex(1763680847),
		blockNumber: numberToHex(23843479),
		txIndex: numberToHex(210),
		logIndex: numberToHex(754),
		chainId: numberToHex(1),
		tableId: 5,
	});

	expect(id).toBe("691fa24f016bd29700d202f200010005");

	expect(parseId(id)).toMatchObject({
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
	expect(getPartition("0x5eb01705")).toEqual(202004);
	expect(getPartition("0x6a153133")).toEqual(202604);
});

test.concurrent("groups partitions in a SQL clause", () => {
	const ids = [
		"5eb0170500989680001b002b00010002", //
		"6a15313301802d5b0011004b00010002",
	];

	expect(getPartitions(ids)).toMatchObject([
		"(partition = 202004 AND id IN (unhex('5eb0170500989680001b002b00010002')))",
		"(partition = 202604 AND id IN (unhex('6a15313301802d5b0011004b00010002')))",
	]);
});
