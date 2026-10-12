import { http } from "univo/proxy";
import { createFileRoute } from "@tanstack/react-router";

import { univo } from "@/univo";

const fetch = http({ indexer: univo, signingKey: process.env.UNIVO_SIGNING_KEY });

export const Route = createFileRoute("/api/univo")({
	server: {
		handlers: {
			GET: ({ request }) => fetch(request),
			PUT: ({ request }) => fetch(request),
			POST: ({ request }) => fetch(request),
			HEAD: ({ request }) => fetch(request),
			PATCH: ({ request }) => fetch(request),
			DELETE: ({ request }) => fetch(request),
			OPTIONS: ({ request }) => fetch(request),
		},
	},
});
