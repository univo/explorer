import { test } from "vitest";

import { deserializeCursor, serializeCursor } from "./cursor";

test("serializes cursors with millisecond timestamps", ({ expect }) => {
	const cursor = serializeCursor({
		chain: 1,
		tx_index: 42,
		log_index: 1234,
		block_number: 10000000,
		tag: "log_erc20_transfer_v2",
		block_timestamp: new Date("2020-01-01T00:00:00.789Z"),
	});

	expect(cursor).toBe("5e0be10000989680002a0004d200010034");

	expect(deserializeCursor(cursor)).toEqual({
		chain: 1,
		tx_index: 42,
		log_index: 1234,
		block_number: 10000000,
		tag: "log_erc20_transfer_v2",
		block_timestamp: new Date("2020-01-01T00:00:00.000Z"),
	});
});
