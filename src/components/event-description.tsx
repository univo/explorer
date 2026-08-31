import type { Event } from "@/db/events";

import { LogEnsNewOwnerV1Description } from "@/events/log_ens_new_owner_v1/component";
import { LogFwaNftListedV1Description } from "@/events/log_fwa_nft_listed_v1/component";
import { LogErc20TransferV1Description } from "@/events/log_erc20_transfer_v1/component";
import { LogErc20ApprovalV1Description } from "@/events/log_erc20_approval_v1/component";
import { LogUniswapV3SwapV1Description } from "@/events/log_uniswap_v3_swap_v1/component";
import { LogErc721TransferV1Description } from "@/events/log_erc721_transfer_v1/component";
import { LogErc721ApprovalV1Description } from "@/events/log_erc721_approval_v1/component";
import { LogFwaNftAllocatedV1Description } from "@/events/log_fwa_nft_allocated_v1/component";
import { LogEnsReverseClaimedV1Description } from "@/events/log_ens_reverse_claimed_v1/component";
import { LogUniswapV3PoolCreatedV1Description } from "@/events/log_uniswap_v3_pool_created_v1/component";
import { LogEnsNameForAddrChangedV1Description } from "@/events/log_ens_name_for_addr_changed_v1/component";

import { IntentIdmV1AccountDescription } from "@/events/intent_idm_v1/component";
import { IntentFwaWonV1AccountDescription } from "@/events/intent_fwa_won_v1/component";
import { IntentFwaWonV2AccountDescription } from "@/events/intent_fwa_won_v2/component";
import { IntentAaveV3RepayV1AccountDescription } from "@/events/intent_aave_v3_repay_v1/component";
import { IntentFwaDepositedV1AccountDescription } from "@/events/intent_fwa_deposited_v1/component";
import { IntentAaveV3SupplyV1AccountDescription } from "@/events/intent_aave_v3_supply_v1/component";
import { IntentAaveV3BorrowV1AccountDescription } from "@/events/intent_aave_v3_borrow_v1/component";
import { IntentErc20ApprovalV1AccountDescription } from "@/events/intent_erc20_approval_v1/component";
import { IntentErc20TransferV1AccountDescription } from "@/events/intent_erc20_transfer_v1/component";
import { IntentUsdcBlacklistV1AccountDescription } from "@/events/intent_usdc_blacklist_v1/component";
import { IntentUniswapV3SwapV1AccountDescription } from "@/events/intent_uniswap_v3_swap_v1/component";
import { IntentUniswapV3MintV1AccountDescription } from "@/events/intent_uniswap_v3_mint_v1/component";
import { IntentErc721ApprovalV1AccountDescription } from "@/events/intent_erc721_approval_v1/component";
import { IntentErc721TransferV1AccountDescription } from "@/events/intent_erc721_transfer_v1/component";
import { IntentNativeTransferV1AccountDescription } from "@/events/intent_native_transfer_v1/component";
import { IntentAaveV3WithdrawV1AccountDescription } from "@/events/intent_aave_v3_withdraw_v1/component";
import { IntentCancelPendingTxV1AccountDescription } from "@/events/intent_cancel_pending_tx_v1/component";
import { IntentTornadoWithdrawalV1AccountDescription } from "@/events/intent_tornado_withdrawal_v1/component";
import { IntentEnsNameRegisteredV1AccountDescription } from "@/events/intent_ens_name_registered_v1/component";
import { IntentContractDeploymentV1AccountDescription } from "@/events/intent_contract_deployment_v1/component";

export function EventDescription(props: { event: Event; address: `0x${string}` | undefined }) {
	// Intents

	if (props.event.tag === "intent_native_transfer_v1") {
		return <IntentNativeTransferV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_erc20_transfer_v1") {
		return <IntentErc20TransferV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_erc20_approval_v1") {
		return <IntentErc20ApprovalV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_erc721_transfer_v1") {
		return <IntentErc721TransferV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_erc721_approval_v1") {
		return <IntentErc721ApprovalV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_idm_v1") {
		return <IntentIdmV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_ens_name_registered_v1") {
		return <IntentEnsNameRegisteredV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_contract_deployment_v1") {
		return <IntentContractDeploymentV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_cancel_pending_tx_v1") {
		return <IntentCancelPendingTxV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_tornado_withdrawal_v1") {
		return <IntentTornadoWithdrawalV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_usdc_blacklist_v1") {
		return <IntentUsdcBlacklistV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_fwa_deposited_v1") {
		return <IntentFwaDepositedV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_fwa_won_v1") {
		return <IntentFwaWonV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_fwa_won_v2") {
		return <IntentFwaWonV2AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_aave_v3_supply_v1") {
		return <IntentAaveV3SupplyV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_aave_v3_withdraw_v1") {
		return <IntentAaveV3WithdrawV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_aave_v3_borrow_v1") {
		return <IntentAaveV3BorrowV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_aave_v3_repay_v1") {
		return <IntentAaveV3RepayV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_uniswap_v3_swap_v1") {
		return <IntentUniswapV3SwapV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_uniswap_v3_mint_v1") {
		return <IntentUniswapV3MintV1AccountDescription event={props.event} address={props.address} />;
	}

	// Log events

	if (props.event.tag === "log_ens_new_owner_v1") {
		return <LogEnsNewOwnerV1Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_ens_reverse_claimed_v1") {
		return <LogEnsReverseClaimedV1Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_ens_name_for_addr_changed_v1") {
		return <LogEnsNameForAddrChangedV1Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_erc20_approval_v1") {
		return <LogErc20ApprovalV1Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_erc20_transfer_v1") {
		return <LogErc20TransferV1Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_erc721_transfer_v1") {
		return <LogErc721TransferV1Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_erc721_approval_v1") {
		return <LogErc721ApprovalV1Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_fwa_nft_listed_v1") {
		return <LogFwaNftListedV1Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_fwa_nft_allocated_v1") {
		return <LogFwaNftAllocatedV1Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_uniswap_v3_pool_created_v1") {
		return <LogUniswapV3PoolCreatedV1Description event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_uniswap_v3_swap_v1") {
		return <LogUniswapV3SwapV1Description event={props.event} address={props.address} />;
	}
}
