import { and, count, eq, sql } from "drizzle-orm";
import { test } from "vitest";

import { event, getLogErc20TransferV2 } from "./event";
import { table } from "./table";
import { createPostgresClient } from "@/db/client";
import { parseId } from "@/helpers";
import { test_getBlock } from "@/tests/utils";

test.concurrent("log_erc20_transfer_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10000000 });
	const events = event.handler(block);
	const ids = events.map((event) => event.id);

	await event.storage.delete(events);
	expect(await getLogErc20TransferV2(ids)).toStrictEqual([]);

	// The first write verifies batch deduplication; the second creates database duplicates.
	await event.storage.upsert([...events, ...events]);
	await event.storage.upsert(events);

	const first = parseId(ids[0]);
	const client = await createPostgresClient();
	const [{ value: copies }] = await client
		.select({ value: count() })
		.from(table)
		.where(
			and(
				eq(table.block_timestamp, new Date(first.blockTimestamp * 1000)),
				eq(table.block_number, first.blockNumber),
				eq(table.tx_index, first.txIndex),
				eq(table.log_index, first.logIndex),
				eq(table.chain, first.chainId),
			),
		);

	expect(copies).toBe(2);
	expect(await getLogErc20TransferV2(ids)).toStrictEqual(events);

	await event.storage.delete(events);
	expect(await getLogErc20TransferV2(ids)).toStrictEqual([]);
});

test.concurrent("log_erc20_transfer_v2 is a one-day hypertable", async ({ expect }) => {
	const client = await createPostgresClient();
	const result = await client.execute<{ column_name: string; chunk_interval_seconds: number }>(sql`
		SELECT
			column_name,
			EXTRACT(EPOCH FROM time_interval)::integer AS chunk_interval_seconds
		FROM timescaledb_information.dimensions
		WHERE hypertable_schema = 'public'
			AND hypertable_name = 'log_erc20_transfer_v2'
	`);

	expect(result.rows).toStrictEqual([
		{
			column_name: "block_timestamp",
			chunk_interval_seconds: 86400,
		},
	]);
});
