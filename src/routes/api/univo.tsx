import { createFileRoute } from "@tanstack/react-router";

import { univo } from "@/lib/univo";

// We import every event here so that we guarantee all the events will be picked up by the indexer.

import "@/events/erc20-transfer-v2/event";
import "@/events/erc20-approval-v2/event";
import "@/events/erc721-approval-v2/event";
import "@/events/erc721-transfer-v2/event";
import "@/events/native-transfer-v2/event";
import "@/events/cancel-pending-tx-v2/event";
import "@/events/input-data-message-v2/event";
import "@/events/contract-deployment-v2/event";
import "@/events/ens-name-registered-v2/event";

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
