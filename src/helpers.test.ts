import { numberToHex } from "viem";
import { expect, test } from "vitest";
import { formatTokenAmount, parseId, createId } from "@/helpers";

test.concurrent("creates and parses ids", () => {
	const id = createId({
		blockTimestamp: numberToHex(1763680847),
		blockNumber: numberToHex(23843479),
		txIndex: numberToHex(210),
		logIndex: numberToHex(754),
		chainId: numberToHex(1),
		tableId: 5,
	});

	expect(id).toBe("691fa24f016bd29700d20002f200010005");

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
	expect(formatTokenAmount("0xC", 18)).toBe("0.000000000000000012");
	expect(formatTokenAmount("0x7D", 18)).toBe("0.00000000000000013");
});
