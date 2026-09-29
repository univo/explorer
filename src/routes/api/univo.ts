import { createFileRoute } from "@tanstack/react-router";

import { univo } from "@/univo";

export const Route = createFileRoute("/api/univo")({
	server: {
		handlers: {
			GET: ({ request }) => univo.fetch(request),
			PUT: ({ request }) => univo.fetch(request),
			POST: ({ request }) => univo.fetch(request),
			HEAD: ({ request }) => univo.fetch(request),
			PATCH: ({ request }) => univo.fetch(request),
			DELETE: ({ request }) => univo.fetch(request),
			OPTIONS: ({ request }) => univo.fetch(request),
		},
	},
});
