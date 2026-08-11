import { createFileRoute } from "@tanstack/react-router";

import { univo } from "@/lib/univo";

// We import every event here so that we guarantee all the events will be picked up by the indexer.

import "@/events/intent_idm_v1/event";
import "@/events/intent_fwa_won_v1/event";
import "@/events/log_erc20_approval_v1/event";
import "@/events/log_erc20_transfer_v1/event";
import "@/events/log_fwa_nft_listed_v1/event";
import "@/events/log_erc721_transfer_v1/event";
import "@/events/log_erc721_approval_v1/event";
import "@/events/log_uniswap_v3_swap_v1/event";
import "@/events/intent_fwa_deposited_v1/event";
import "@/events/intent_aave_v3_repay_v1/event";
import "@/events/intent_usdc_blacklist_v1/event";
import "@/events/intent_aave_v3_supply_v1/event";
import "@/events/intent_aave_v3_borrow_v1/event";
import "@/events/intent_native_transfer_v1/event";
import "@/events/intent_uniswap_v3_swap_v1/event";
import "@/events/intent_uniswap_v3_mint_v1/event";
import "@/events/intent_aave_v3_withdraw_v1/event";
import "@/events/intent_cancel_pending_tx_v1/event";
import "@/events/intent_tornado_withdrawal_v1/event";
import "@/events/intent_contract_deployment_v1/event";
import "@/events/intent_ens_name_registered_v1/event";
import "@/events/log_uniswap_v3_pool_created_v1/event";

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
