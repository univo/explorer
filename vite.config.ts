import { defineConfig } from "vite";
import rsc from "@vitejs/plugin-rsc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import paths from "vite-tsconfig-paths";
import { devtools } from "@tanstack/devtools-vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

const config = defineConfig({
	plugins: [
		devtools(),
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
