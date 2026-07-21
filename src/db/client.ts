import { Client } from "pg";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/node-postgres";

import { schema } from "./schema";

export async function createPostgresClient() {
	const client = new Client({
		connectionString: env.PG.connectionString,
	});

	await client.connect();

	return drizzle(client, { schema });
}
