export type Chain = 1;

// Responsible for mapping the full set of supported chain ids with our internal chain id representation.
// We use an internal representation so that we can use the minimum number of bytes to represent a chain id.
// E.g. in our id creation we use a 2 byte unsigned integer allowing 65,535 chains

export const chains: Record<Chain, number> = {
	1: 1,
};

// Reverse look up table for chains to convert back

export const chainsReversed: Record<number, Chain> = {
	1: 1,
};

// Similarly we use a 2 byte unsigned integer to store table identifiers

// TODO: Move and update to actual table names

export const tables = {
	native_transfer_v1: 0,
	erc20_transfer_v1: 1,
	erc20_approval_v1: 2,
	input_data_message_v1: 3,
	contract_deployment_v1: 4,
	ens_name_registered_v1: 5,
	cancel_pending_tx_v1: 6,
	erc721_transfer_v1: 7,
	erc721_approval_v1: 8,
	erc20_transfer_v2: 9,
	native_transfer_v2: 10,
	erc20_approval_v2: 11,
	input_data_message_v2: 12,
	contract_deployment_v2: 13,
	ens_name_registered_v2: 14,
	cancel_pending_tx_v2: 15,
	erc721_transfer_v2: 16,
	erc721_approval_v2: 17,
	tornado_cash_withdrawal_v1: 18,
	usdc_blacklist_v1: 19,
};
