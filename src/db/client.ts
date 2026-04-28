import { createClient } from "@clickhouse/client-web";

export const db = createClient({
	url: process.env.CLICKHOUSE_URL,
	username: process.env.CLICKHOUSE_USERNAME,
	password: process.env.CLICKHOUSE_PASSWORD,

	max_open_connections: 100,

	keep_alive: {
		enabled: true,
	},

	clickhouse_settings: {
		// In production we want to deduplicate inserts. However in development this behaviour is undesired
		// specifically for testing purposes. Our tests are repeatedly deleting and inserting the same rows,
		// so we disable this behaviour so that those "duplicate" inserts actually insert the rows to the table
		// https://clickhouse.com/docs/guides/developer/deduplicating-inserts-on-retries#how-insert-deduplication-works
		insert_deduplicate: import.meta.env.PROD ? 1 : 0,
	},
});
