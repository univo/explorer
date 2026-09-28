import type { Event } from "@/db/events";

import { LogEnsNewOwnerV2Description } from "@/events/log_ens_new_owner_v2/component";
import { LogFwaNftListedV2Description } from "@/events/log_fwa_nft_listed_v2/component";
import { LogErc20TransferV2Description } from "@/events/log_erc20_transfer_v2/component";
import { LogErc20ApprovalV2Description } from "@/events/log_erc20_approval_v2/component";
import { LogUniswapV3SwapV2Description } from "@/events/log_uniswap_v3_swap_v2/component";
import { LogErc721TransferV2Description } from "@/events/log_erc721_transfer_v2/component";
import { LogErc721ApprovalV2Description } from "@/events/log_erc721_approval_v2/component";
import { LogFwaNftAllocatedV2Description } from "@/events/log_fwa_nft_allocated_v2/component";
import { LogEnsReverseClaimedV2Description } from "@/events/log_ens_reverse_claimed_v2/component";
import { LogUniswapV3PoolCreatedV2Description } from "@/events/log_uniswap_v3_pool_created_v2/component";
import { LogEnsNameForAddrChangedV2Description } from "@/events/log_ens_name_for_addr_changed_v2/component";

import { IntentIdmV1AccountDescription } from "@/events/intent_idm_v1/component";
import { IntentFwaWonV2AccountDescription } from "@/events/intent_fwa_won_v2/component";
import { IntentFwaAcquireV2AccountDescription } from "@/events/intent_fwa_acquire_v2/component";
import { IntentAaveV3RepayV2AccountDescription } from "@/events/intent_aave_v3_repay_v2/component";
import { IntentFwaDepositedV2AccountDescription } from "@/events/intent_fwa_deposited_v2/component";
import { IntentAaveV3SupplyV2AccountDescription } from "@/events/intent_aave_v3_supply_v2/component";
import { IntentAaveV3BorrowV2AccountDescription } from "@/events/intent_aave_v3_borrow_v2/component";
import { IntentErc20ApprovalV2AccountDescription } from "@/events/intent_erc20_approval_v2/component";
import { IntentErc20TransferV2AccountDescription } from "@/events/intent_erc20_transfer_v2/component";
import { IntentUsdcBlacklistV1AccountDescription } from "@/events/intent_usdc_blacklist_v1/component";
import { IntentUniswapV3SwapV1AccountDescription } from "@/events/intent_uniswap_v3_swap_v1/component";
import { IntentUniswapV3MintV1AccountDescription } from "@/events/intent_uniswap_v3_mint_v1/component";
import { IntentErc721ApprovalV2AccountDescription } from "@/events/intent_erc721_approval_v2/component";
import { IntentErc721TransferV2AccountDescription } from "@/events/intent_erc721_transfer_v2/component";
import { IntentNativeTransferV1AccountDescription } from "@/events/intent_native_transfer_v1/component";
import { IntentAaveV3WithdrawV2AccountDescription } from "@/events/intent_aave_v3_withdraw_v2/component";
import { IntentCancelPendingTxV2AccountDescription } from "@/events/intent_cancel_pending_tx_v2/component";
import { IntentTornadoWithdrawalV1AccountDescription } from "@/events/intent_tornado_withdrawal_v1/component";
import { IntentEnsNameRegisteredV2AccountDescription } from "@/events/intent_ens_name_registered_v2/component";
import { IntentContractDeploymentV2AccountDescription } from "@/events/intent_contract_deployment_v2/component";

export function EventDescription(props: { event: Event; address: `0x${string}` | undefined }) {
	// Intents

	if (props.event.tag === "intent_native_transfer_v1") {
		return <IntentNativeTransferV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_erc20_transfer_v2") {
		return <IntentErc20TransferV2AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_erc20_approval_v2") {
		return <IntentErc20ApprovalV2AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_erc721_transfer_v2") {
		return <IntentErc721TransferV2AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_erc721_approval_v2") {
		return <IntentErc721ApprovalV2AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_idm_v1") {
		return <IntentIdmV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_ens_name_registered_v2") {
		return <IntentEnsNameRegisteredV2AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_contract_deployment_v2") {
		return <IntentContractDeploymentV2AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_cancel_pending_tx_v2") {
		return <IntentCancelPendingTxV2AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_tornado_withdrawal_v1") {
		return <IntentTornadoWithdrawalV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_usdc_blacklist_v1") {
		return <IntentUsdcBlacklistV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_fwa_deposited_v2") {
		return <IntentFwaDepositedV2AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_fwa_won_v2") {
		return <IntentFwaWonV2AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_fwa_acquire_v2") {
		return <IntentFwaAcquireV2AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_aave_v3_supply_v2") {
		return <IntentAaveV3SupplyV2AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_aave_v3_withdraw_v2") {
		return <IntentAaveV3WithdrawV2AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_aave_v3_borrow_v2") {
		return <IntentAaveV3BorrowV2AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_aave_v3_repay_v2") {
		return <IntentAaveV3RepayV2AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_uniswap_v3_swap_v1") {
		return <IntentUniswapV3SwapV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_uniswap_v3_mint_v1") {
		return <IntentUniswapV3MintV1AccountDescription event={props.event} address={props.address} />;
	}

	// Log events

	if (props.event.tag === "log_ens_new_owner_v2") {
		return <LogEnsNewOwnerV2Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_ens_reverse_claimed_v2") {
		return <LogEnsReverseClaimedV2Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_ens_name_for_addr_changed_v2") {
		return <LogEnsNameForAddrChangedV2Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_erc20_approval_v2") {
		return <LogErc20ApprovalV2Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_erc20_transfer_v2") {
		return <LogErc20TransferV2Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_erc721_transfer_v2") {
		return <LogErc721TransferV2Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_erc721_approval_v2") {
		return <LogErc721ApprovalV2Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_fwa_nft_listed_v2") {
		return <LogFwaNftListedV2Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_fwa_nft_allocated_v2") {
		return <LogFwaNftAllocatedV2Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_uniswap_v3_pool_created_v2") {
		return <LogUniswapV3PoolCreatedV2Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_uniswap_v3_swap_v2") {
		return <LogUniswapV3SwapV2Description event={props.event} address={props.address} />;
	}
}
