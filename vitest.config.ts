import paths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

export default defineConfig({
	test: {
		testTimeout: 2 * 60 * 1000,
		setupFiles: ["./src/tests/setup.ts"],
	},
	plugins: [
		paths({
			projects: ["./tsconfig.json"],
		}),
		cloudflareTest({
			wrangler: { configPath: "./wrangler.jsonc" },
		}),
	],
});
