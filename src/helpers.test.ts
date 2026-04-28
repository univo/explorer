import { numberToHex } from "viem";
import { expect, test } from "vitest";
import { createId, formatTokenAmount, parseId } from "@/helpers";

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

test.concurrent("formats token amounts", () => {
	expect(formatTokenAmount("12", 18)).toBe("0.000000000000000012");
	expect(formatTokenAmount("125", 18)).toBe("0.00000000000000013");
});
