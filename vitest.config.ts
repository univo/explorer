import { loadEnv } from "vite";
import paths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	const hyperdrive = env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_PG;

	return {
		test: {
			testTimeout: 2 * 60 * 1000,
			setupFiles: ["./src/tests/setup.ts"],
		},

		plugins: [
			paths({
				projects: ["./tsconfig.json"],
			}),
			cloudflareTest({
				miniflare: {
					hyperdrives: {
						PG: hyperdrive,
					},
				},

				wrangler: {
					configPath: "./wrangler.jsonc",
				},
			}),
		],
	};
});
