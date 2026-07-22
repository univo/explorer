import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	verbose: true,
	dialect: "postgresql",
	out: "./src/db/migrations",
	schema: "./src/db/schema.ts",
	migrations: {
		schema: "public",
		table: "migrations",
	},
	dbCredentials: {
		url: process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_PG,
	},
});
