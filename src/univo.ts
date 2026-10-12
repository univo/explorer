import { defineIndexer } from "univo";
import { env } from "cloudflare:workers";
import { defineStorage } from "univo/metadata";
import { r2 } from "univo/metadata/adapters/r2-binding";

import { node } from "./helpers";

import { action as invalidate_ens_cache } from "./actions/invalidate_ens_cache";

import { event as intent_idm_v2 } from "./events/intent_idm_v2/event";
import { event as intent_fwa_won_v3 } from "./events/intent_fwa_won_v3/event";
import { intent_idm_v2_index_account_v4 } from "./events/intent_idm_v2/event";
import { event as intent_fwa_acquire_v2 } from "./events/intent_fwa_acquire_v2/event";
import { intent_fwa_won_v3_index_account_v4 } from "./events/intent_fwa_won_v3/event";
import { event as intent_aave_v3_repay_v2 } from "./events/intent_aave_v3_repay_v2/event";
import { event as intent_fwa_deposited_v2 } from "./events/intent_fwa_deposited_v2/event";
import { event as intent_aave_v3_borrow_v2 } from "./events/intent_aave_v3_borrow_v2/event";
import { event as intent_aave_v3_supply_v2 } from "./events/intent_aave_v3_supply_v2/event";
import { event as intent_erc20_approval_v2 } from "./events/intent_erc20_approval_v2/event";
import { event as intent_erc20_transfer_v2 } from "./events/intent_erc20_transfer_v2/event";
import { intent_idm_v2_index_block_number_tx_index_v4 } from "./events/intent_idm_v2/event";
import { event as intent_usdc_blacklist_v2 } from "./events/intent_usdc_blacklist_v2/event";
import { event as intent_erc721_approval_v2 } from "./events/intent_erc721_approval_v2/event";
import { event as intent_erc721_transfer_v2 } from "./events/intent_erc721_transfer_v2/event";
import { intent_fwa_acquire_v2_index_account_v4 } from "./events/intent_fwa_acquire_v2/event";
import { event as intent_native_transfer_v2 } from "./events/intent_native_transfer_v2/event";
import { event as intent_uniswap_v3_mint_v2 } from "./events/intent_uniswap_v3_mint_v2/event";
import { event as intent_uniswap_v3_swap_v2 } from "./events/intent_uniswap_v3_swap_v2/event";
import { event as intent_aave_v3_withdraw_v2 } from "./events/intent_aave_v3_withdraw_v2/event";
import { intent_aave_v3_repay_v2_index_account_v4 } from "./events/intent_aave_v3_repay_v2/event";
import { event as intent_cancel_pending_tx_v2 } from "./events/intent_cancel_pending_tx_v2/event";
import { intent_fwa_deposited_v2_index_account_v4 } from "./events/intent_fwa_deposited_v2/event";
import { intent_aave_v3_borrow_v2_index_account_v4 } from "./events/intent_aave_v3_borrow_v2/event";
import { intent_aave_v3_supply_v2_index_account_v4 } from "./events/intent_aave_v3_supply_v2/event";
import { intent_erc20_approval_v2_index_account_v4 } from "./events/intent_erc20_approval_v2/event";
import { intent_erc20_transfer_v2_index_account_v4 } from "./events/intent_erc20_transfer_v2/event";
import { intent_fwa_won_v3_index_block_number_tx_index_v4 } from "./events/intent_fwa_won_v3/event";
import { event as intent_tornado_withdrawal_v2 } from "./events/intent_tornado_withdrawal_v2/event";
import { intent_usdc_blacklist_v2_index_account_v4 } from "./events/intent_usdc_blacklist_v2/event";
import { event as intent_contract_deployment_v2 } from "./events/intent_contract_deployment_v2/event";
import { event as intent_ens_name_registered_v2 } from "./events/intent_ens_name_registered_v2/event";
import { intent_erc721_approval_v2_index_account_v4 } from "./events/intent_erc721_approval_v2/event";
import { intent_erc721_transfer_v2_index_account_v4 } from "./events/intent_erc721_transfer_v2/event";
import { intent_native_transfer_v2_index_account_v4 } from "./events/intent_native_transfer_v2/event";
import { intent_uniswap_v3_mint_v2_index_account_v4 } from "./events/intent_uniswap_v3_mint_v2/event";
import { intent_uniswap_v3_swap_v2_index_account_v4 } from "./events/intent_uniswap_v3_swap_v2/event";
import { intent_aave_v3_withdraw_v2_index_account_v4 } from "./events/intent_aave_v3_withdraw_v2/event";
import { intent_cancel_pending_tx_v2_index_account_v4 } from "./events/intent_cancel_pending_tx_v2/event";
import { intent_fwa_acquire_v2_index_block_number_tx_index_v4 } from "./events/intent_fwa_acquire_v2/event";
import { intent_tornado_withdrawal_v2_index_account_v4 } from "./events/intent_tornado_withdrawal_v2/event";
import { intent_contract_deployment_v2_index_account_v4 } from "./events/intent_contract_deployment_v2/event";
import { intent_ens_name_registered_v2_index_account_v4 } from "./events/intent_ens_name_registered_v2/event";
import { intent_aave_v3_repay_v2_index_block_number_tx_index_v4 } from "./events/intent_aave_v3_repay_v2/event";
import { intent_fwa_deposited_v2_index_block_number_tx_index_v4 } from "./events/intent_fwa_deposited_v2/event";
import { intent_aave_v3_borrow_v2_index_block_number_tx_index_v4 } from "./events/intent_aave_v3_borrow_v2/event";
import { intent_aave_v3_supply_v2_index_block_number_tx_index_v4 } from "./events/intent_aave_v3_supply_v2/event";
import { intent_erc20_approval_v2_index_block_number_tx_index_v4 } from "./events/intent_erc20_approval_v2/event";
import { intent_erc20_transfer_v2_index_block_number_tx_index_v4 } from "./events/intent_erc20_transfer_v2/event";
import { intent_usdc_blacklist_v2_index_block_number_tx_index_v4 } from "./events/intent_usdc_blacklist_v2/event";
import { intent_erc721_approval_v2_index_block_number_tx_index_v4 } from "./events/intent_erc721_approval_v2/event";
import { intent_erc721_transfer_v2_index_block_number_tx_index_v4 } from "./events/intent_erc721_transfer_v2/event";
import { intent_native_transfer_v2_index_block_number_tx_index_v4 } from "./events/intent_native_transfer_v2/event";
import { intent_uniswap_v3_mint_v2_index_block_number_tx_index_v4 } from "./events/intent_uniswap_v3_mint_v2/event";
import { intent_uniswap_v3_swap_v2_index_block_number_tx_index_v4 } from "./events/intent_uniswap_v3_swap_v2/event";
import { intent_aave_v3_withdraw_v2_index_block_number_tx_index_v4 } from "./events/intent_aave_v3_withdraw_v2/event";
import { intent_cancel_pending_tx_v2_index_block_number_tx_index_v4 } from "./events/intent_cancel_pending_tx_v2/event";
import { intent_tornado_withdrawal_v2_index_block_number_tx_index_v4 } from "./events/intent_tornado_withdrawal_v2/event";
import { intent_contract_deployment_v2_index_block_number_tx_index_v4 } from "./events/intent_contract_deployment_v2/event";
import { intent_ens_name_registered_v2_index_block_number_tx_index_v4 } from "./events/intent_ens_name_registered_v2/event";

import { event as log_ens_new_owner_v2 } from "./events/log_ens_new_owner_v2/event";
import { event as log_erc20_approval_v2 } from "./events/log_erc20_approval_v2/event";
import { event as log_erc20_transfer_v2 } from "./events/log_erc20_transfer_v2/event";
import { event as log_fwa_nft_listed_v2 } from "./events/log_fwa_nft_listed_v2/event";
import { event as log_erc721_approval_v2 } from "./events/log_erc721_approval_v2/event";
import { event as log_erc721_transfer_v2 } from "./events/log_erc721_transfer_v2/event";
import { event as log_uniswap_v3_swap_v2 } from "./events/log_uniswap_v3_swap_v2/event";
import { event as log_fwa_nft_allocated_v2 } from "./events/log_fwa_nft_allocated_v2/event";
import { event as log_ens_reverse_claimed_v2 } from "./events/log_ens_reverse_claimed_v2/event";
import { log_fwa_nft_allocated_v2_index_account_v4 } from "./events/log_fwa_nft_allocated_v2/event";
import { event as log_uniswap_v3_pool_created_v2 } from "./events/log_uniswap_v3_pool_created_v2/event";
import { log_ens_new_owner_v2_index_block_number_tx_index_v4 } from "./events/log_ens_new_owner_v2/event";
import { event as log_ens_name_for_addr_changed_v2 } from "./events/log_ens_name_for_addr_changed_v2/event";
import { log_erc20_approval_v2_index_block_number_tx_index_v4 } from "./events/log_erc20_approval_v2/event";
import { log_erc20_transfer_v2_index_block_number_tx_index_v4 } from "./events/log_erc20_transfer_v2/event";
import { log_fwa_nft_listed_v2_index_block_number_tx_index_v4 } from "./events/log_fwa_nft_listed_v2/event";
import { log_erc721_approval_v2_index_block_number_tx_index_v4 } from "./events/log_erc721_approval_v2/event";
import { log_erc721_transfer_v2_index_block_number_tx_index_v4 } from "./events/log_erc721_transfer_v2/event";
import { log_uniswap_v3_swap_v2_index_block_number_tx_index_v4 } from "./events/log_uniswap_v3_swap_v2/event";
import { log_fwa_nft_allocated_v2_index_block_number_tx_index_v4 } from "./events/log_fwa_nft_allocated_v2/event";
import { log_ens_reverse_claimed_v2_index_block_number_tx_index_v4 } from "./events/log_ens_reverse_claimed_v2/event";
import { log_uniswap_v3_pool_created_v2_index_block_number_tx_index_v4 } from "./events/log_uniswap_v3_pool_created_v2/event";
import { log_ens_name_for_addr_changed_v2_index_block_number_tx_index_v4 } from "./events/log_ens_name_for_addr_changed_v2/event";

export const indexer = defineIndexer({
	quiet: false,

	metadataStorage: defineStorage({
		adapter: r2({
			binding: env.BUCKET,
		}),
	}),

	getBlock: async (head) => {
		const [eth_getBlockByNumber, eth_getBlockReceipts] = await Promise.all([
			node.request({ method: "eth_getBlockByNumber", params: [head.number, true] }),
			node.request({ method: "eth_getBlockReceipts", params: [head.number] }),
		]);

		return {
			eth_chainId: head.chain,
			eth_getBlockByNumber,
			eth_getBlockReceipts,
		};
	},

	actions: [
		invalidate_ens_cache, //
	],

	events: [
		intent_aave_v3_borrow_v2,
		intent_aave_v3_borrow_v2_index_block_number_tx_index_v4,
		intent_aave_v3_borrow_v2_index_account_v4,
		intent_aave_v3_repay_v2,
		intent_aave_v3_repay_v2_index_block_number_tx_index_v4,
		intent_aave_v3_repay_v2_index_account_v4,
		intent_aave_v3_supply_v2,
		intent_aave_v3_supply_v2_index_block_number_tx_index_v4,
		intent_aave_v3_supply_v2_index_account_v4,
		intent_aave_v3_withdraw_v2,
		intent_aave_v3_withdraw_v2_index_block_number_tx_index_v4,
		intent_aave_v3_withdraw_v2_index_account_v4,
		intent_cancel_pending_tx_v2,
		intent_cancel_pending_tx_v2_index_block_number_tx_index_v4,
		intent_cancel_pending_tx_v2_index_account_v4,
		intent_contract_deployment_v2,
		intent_contract_deployment_v2_index_block_number_tx_index_v4,
		intent_contract_deployment_v2_index_account_v4,
		intent_ens_name_registered_v2,
		intent_ens_name_registered_v2_index_block_number_tx_index_v4,
		intent_ens_name_registered_v2_index_account_v4,
		intent_erc20_approval_v2,
		intent_erc20_approval_v2_index_block_number_tx_index_v4,
		intent_erc20_approval_v2_index_account_v4,
		intent_erc20_transfer_v2,
		intent_erc20_transfer_v2_index_block_number_tx_index_v4,
		intent_erc20_transfer_v2_index_account_v4,
		intent_erc721_approval_v2,
		intent_erc721_approval_v2_index_block_number_tx_index_v4,
		intent_erc721_approval_v2_index_account_v4,
		intent_erc721_transfer_v2,
		intent_erc721_transfer_v2_index_block_number_tx_index_v4,
		intent_erc721_transfer_v2_index_account_v4,
		intent_fwa_acquire_v2,
		intent_fwa_acquire_v2_index_block_number_tx_index_v4,
		intent_fwa_acquire_v2_index_account_v4,
		intent_fwa_deposited_v2,
		intent_fwa_deposited_v2_index_block_number_tx_index_v4,
		intent_fwa_deposited_v2_index_account_v4,
		intent_fwa_won_v3,
		intent_fwa_won_v3_index_block_number_tx_index_v4,
		intent_fwa_won_v3_index_account_v4,
		intent_idm_v2,
		intent_idm_v2_index_block_number_tx_index_v4,
		intent_idm_v2_index_account_v4,
		intent_native_transfer_v2,
		intent_native_transfer_v2_index_block_number_tx_index_v4,
		intent_native_transfer_v2_index_account_v4,
		intent_tornado_withdrawal_v2,
		intent_tornado_withdrawal_v2_index_block_number_tx_index_v4,
		intent_tornado_withdrawal_v2_index_account_v4,
		intent_uniswap_v3_mint_v2,
		intent_uniswap_v3_mint_v2_index_block_number_tx_index_v4,
		intent_uniswap_v3_mint_v2_index_account_v4,
		intent_uniswap_v3_swap_v2,
		intent_uniswap_v3_swap_v2_index_block_number_tx_index_v4,
		intent_uniswap_v3_swap_v2_index_account_v4,
		intent_usdc_blacklist_v2,
		intent_usdc_blacklist_v2_index_block_number_tx_index_v4,
		intent_usdc_blacklist_v2_index_account_v4,
		log_ens_name_for_addr_changed_v2,
		log_ens_name_for_addr_changed_v2_index_block_number_tx_index_v4,
		log_ens_new_owner_v2,
		log_ens_new_owner_v2_index_block_number_tx_index_v4,
		log_ens_reverse_claimed_v2,
		log_ens_reverse_claimed_v2_index_block_number_tx_index_v4,
		log_erc20_approval_v2,
		log_erc20_approval_v2_index_block_number_tx_index_v4,
		log_erc20_transfer_v2,
		log_erc20_transfer_v2_index_block_number_tx_index_v4,
		log_erc721_approval_v2,
		log_erc721_approval_v2_index_block_number_tx_index_v4,
		log_erc721_transfer_v2,
		log_erc721_transfer_v2_index_block_number_tx_index_v4,
		log_fwa_nft_allocated_v2,
		log_fwa_nft_allocated_v2_index_block_number_tx_index_v4,
		log_fwa_nft_allocated_v2_index_account_v4,
		log_fwa_nft_listed_v2,
		log_fwa_nft_listed_v2_index_block_number_tx_index_v4,
		log_uniswap_v3_pool_created_v2,
		log_uniswap_v3_pool_created_v2_index_block_number_tx_index_v4,
		log_uniswap_v3_swap_v2,
		log_uniswap_v3_swap_v2_index_block_number_tx_index_v4,
	],
});
