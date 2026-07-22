import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "postgresql",
	out: "./src/db/migrations",
	schema: "./src/db/schema.ts",
	dbCredentials: {
		url: process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_PG,
	},
});
