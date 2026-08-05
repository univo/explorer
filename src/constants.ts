import { getAddress } from "viem";

export type Chain = 1;

// Responsible for mapping the full set of supported chain ids with our internal chain id representation.
// We use an internal representation so that we can use the minimum number of bytes to represent a chain id.
// E.g. in our id creation we use a 2 byte unsigned integer allowing 65,535 chains

export const CHAINS: Record<Chain, number> = {
	1: 1,
};

// Reverse look up table for chains to convert back

export const CHAINS_REVERSED: Record<number, Chain> = {
	1: 1,
};

// Similarly we use a 2 byte unsigned integer to store table identifiers

export const TABLES = {
	native_transfer_v1: 0,
	erc20_transfer_v1: 1,
	erc20_approval_v1: 2,
	input_data_message_v1: 3,
	contract_deployment_v1: 4,
	ens_name_registered_v1: 5,
	cancel_pending_tx_v1: 6,
	erc721_transfer_v1: 7,
	erc721_approval_v1: 8,
	erc20_transfer_v3: 9,
	native_transfer_v3: 10,
	erc20_approval_v3: 11,
	input_data_message_v3: 12,
	contract_deployment_v3: 13,
	ens_name_registered_v3: 14,
	cancel_pending_tx_v3: 15,
	erc721_transfer_v3: 16,
	erc721_approval_v3: 17,
	tornado_cash_withdrawal_v3: 18,
	usdc_blacklist_v3: 19,
	intent_fwa_deposited_v1: 20,
	intent_fwa_won_v1: 21,
	log_fwa_nft_listed_v1: 22,
	intent_aave_v3_supply_v1: 23,
	intent_aave_v3_withdraw_v1: 24,
	intent_aave_v3_borrow_v1: 25,
	intent_aave_v3_repay_v1: 26,
	intent_uniswap_v3_swap_v1: 27,
	intent_uniswap_v3_mint_v1: 28,
	intent_ens_name_registered_v1: 29,
};

// Some of our events operate at the transaction level, i.e. they attempt to classify and interpret a single
// tx as a whole. When this happens it's important to use the `TRANSACTION_EVENT` constant as the provided
// logIndex for those event identifiers. This ensures that any log level events that actually do need to specify
// their logIndex in the id do not conflict. It also makes it easy to detect when we have multiple valid
// interpretations of the same transaction

export const TRANSACTION_EVENT = "0xffffff";

// This our standard way of representing native ether as an ERC-20

export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// Null address utility

export const ZERO_ADDRESS = getAddress("0x0000000000000000000000000000000000000000");
