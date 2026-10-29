-- Compress chunks once their block timestamps are older than three months.
-- Existing eligible history is processed asynchronously by the policy jobs.
CALL add_columnstore_policy('log_erc20_transfer_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('log_erc20_approval_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('log_erc721_approval_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('log_erc721_transfer_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('log_uniswap_v3_pool_created_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('log_uniswap_v3_swap_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('log_ens_name_for_addr_changed_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('log_ens_new_owner_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('log_fwa_nft_listed_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('log_fwa_nft_allocated_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('log_ens_reverse_claimed_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_aave_v3_borrow_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_aave_v3_repay_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_aave_v3_supply_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_aave_v3_withdraw_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_cancel_pending_tx_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_contract_deployment_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_ens_name_registered_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_erc20_approval_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_erc20_transfer_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_erc721_approval_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_erc721_transfer_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_fwa_acquire_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_fwa_deposited_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_fwa_won_v3', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_idm_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_native_transfer_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_tornado_withdrawal_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_uniswap_v3_mint_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_uniswap_v3_swap_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
--> statement-breakpoint
CALL add_columnstore_policy('intent_usdc_blacklist_v2', after => INTERVAL '3 months', if_not_exists => TRUE);
