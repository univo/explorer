import { defineConfig } from "vite";
import rsc from "@vitejs/plugin-rsc";
import paths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

const config = defineConfig({
	plugins: [
		paths({
			projects: ["./tsconfig.json"],
		}),
		tailwindcss(),
		tanstackStart({
			rsc: {
				enabled: true,
			},
			spa: {
				enabled: true,
				prerender: {
					outputPath: "index.html",
				},
			},
		}),
		rsc(),
		cloudflare({
			viteEnvironment: {
				name: "ssr",
				childEnvironments: ["rsc"],
			},
		}),
		react(),
	],
	test: {
		testTimeout: 2 * 60 * 1000,
		setupFiles: ["./app/tests/setup.ts"],
	},
});

export default config;
