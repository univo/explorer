import { createFileRoute } from "@tanstack/react-router";

import { univo } from "@/lib/univo";

// We import every event here so that we guarantee all the events will be picked up by the indexer.

import "@/events/intent_fwa_won_v1/event";
import "@/events/usdc-blacklist-v3/event";
import "@/events/erc20-transfer-v3/event";
import "@/events/erc20-approval-v3/event";
import "@/events/erc721-approval-v3/event";
import "@/events/erc721-transfer-v3/event";
import "@/events/native-transfer-v3/event";
import "@/events/cancel-pending-tx-v3/event";
import "@/events/log_fwa_nft_listed_v1/event";
import "@/events/input-data-message-v3/event";
import "@/events/contract-deployment-v3/event";
import "@/events/ens-name-registered-v3/event";
import "@/events/intent_fwa_deposited_v1/event";
import "@/events/tornado-cash-withdrawal-v3/event";
import "@/events/intent_aave_v3_supply_v1/event";

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
