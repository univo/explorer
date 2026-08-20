import type { Event } from "@/db/events";
import { IntentIdmV1Description } from "@/events/intent_idm_v1/component";
import { IntentFwaWonV1Description } from "@/events/intent_fwa_won_v1/component";
import { LogEnsNewOwnerV1Description } from "@/events/log_ens_new_owner_v1/component";
import { LogFwaNftListedV1Description } from "@/events/log_fwa_nft_listed_v1/component";
import { LogErc20TransferV1Description } from "@/events/log_erc20_transfer_v1/component";
import { LogErc20ApprovalV1Description } from "@/events/log_erc20_approval_v1/component";
import { LogUniswapV3SwapV1Description } from "@/events/log_uniswap_v3_swap_v1/component";
import { LogErc721TransferV1Description } from "@/events/log_erc721_transfer_v1/component";
import { LogErc721ApprovalV1Description } from "@/events/log_erc721_approval_v1/component";
import { IntentAaveV3RepayV1Description } from "@/events/intent_aave_v3_repay_v1/component";
import { IntentFwaDepositedV1Description } from "@/events/intent_fwa_deposited_v1/component";
import { IntentAaveV3SupplyV1Description } from "@/events/intent_aave_v3_supply_v1/component";
import { IntentAaveV3BorrowV1Description } from "@/events/intent_aave_v3_borrow_v1/component";
import { IntentErc20ApprovalV1Description } from "@/events/intent_erc20_approval_v1/component";
import { IntentErc20TransferV1Description } from "@/events/intent_erc20_transfer_v1/component";
import { IntentUsdcBlacklistV1Description } from "@/events/intent_usdc_blacklist_v1/component";
import { IntentUniswapV3SwapV1Description } from "@/events/intent_uniswap_v3_swap_v1/component";
import { IntentUniswapV3MintV1Description } from "@/events/intent_uniswap_v3_mint_v1/component";
import { IntentNativeTransferV1Description } from "@/events/intent_native_transfer_v1/component";
import { LogEnsReverseClaimedV1Description } from "@/events/log_ens_reverse_claimed_v1/component";
import { IntentAaveV3WithdrawV1Description } from "@/events/intent_aave_v3_withdraw_v1/component";
import { IntentCancelPendingTxV1Description } from "@/events/intent_cancel_pending_tx_v1/component";
import { IntentTornadoWithdrawalV1Description } from "@/events/intent_tornado_withdrawal_v1/component";
import { IntentEnsNameRegisteredV1Description } from "@/events/intent_ens_name_registered_v1/component";
import { IntentContractDeploymentV1Description } from "@/events/intent_contract_deployment_v1/component";
import { LogUniswapV3PoolCreatedV1Description } from "@/events/log_uniswap_v3_pool_created_v1/component";
import { LogEnsNameForAddrChangedV1Description } from "@/events/log_ens_name_for_addr_changed_v1/component";

export function EventDescription(props: { event: Event }) {
	if (props.event.tag === "log_ens_new_owner_v1") {
		return <LogEnsNewOwnerV1Description event={props.event} />;
	}

	if (props.event.tag === "log_ens_reverse_claimed_v1") {
		return <LogEnsReverseClaimedV1Description event={props.event} />;
	}

	if (props.event.tag === "log_ens_name_for_addr_changed_v1") {
		return <LogEnsNameForAddrChangedV1Description event={props.event} />;
	}

	if (props.event.tag === "log_erc20_approval_v1") {
		return <LogErc20ApprovalV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_native_transfer_v1") {
		return <IntentNativeTransferV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_erc20_transfer_v1") {
		return <IntentErc20TransferV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_erc20_approval_v1") {
		return <IntentErc20ApprovalV1Description event={props.event} />;
	}

	if (props.event.tag === "log_erc20_transfer_v1") {
		return <LogErc20TransferV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_idm_v1") {
		return <IntentIdmV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_ens_name_registered_v1") {
		return <IntentEnsNameRegisteredV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_contract_deployment_v1") {
		return <IntentContractDeploymentV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_cancel_pending_tx_v1") {
		return <IntentCancelPendingTxV1Description event={props.event} />;
	}

	if (props.event.tag === "log_erc721_transfer_v1") {
		return <LogErc721TransferV1Description event={props.event} />;
	}

	if (props.event.tag === "log_erc721_approval_v1") {
		return <LogErc721ApprovalV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_tornado_withdrawal_v1") {
		return <IntentTornadoWithdrawalV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_usdc_blacklist_v1") {
		return <IntentUsdcBlacklistV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_fwa_deposited_v1") {
		return <IntentFwaDepositedV1Description event={props.event} />;
	}

	if (props.event.tag === "log_fwa_nft_listed_v1") {
		return <LogFwaNftListedV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_fwa_won_v1") {
		return <IntentFwaWonV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_aave_v3_supply_v1") {
		return <IntentAaveV3SupplyV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_aave_v3_withdraw_v1") {
		return <IntentAaveV3WithdrawV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_aave_v3_borrow_v1") {
		return <IntentAaveV3BorrowV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_aave_v3_repay_v1") {
		return <IntentAaveV3RepayV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_uniswap_v3_swap_v1") {
		return <IntentUniswapV3SwapV1Description event={props.event} />;
	}

	if (props.event.tag === "intent_uniswap_v3_mint_v1") {
		return <IntentUniswapV3MintV1Description event={props.event} />;
	}

	if (props.event.tag === "log_uniswap_v3_pool_created_v1") {
		return <LogUniswapV3PoolCreatedV1Description event={props.event} />;
	}

	if (props.event.tag === "log_uniswap_v3_swap_v1") {
		return <LogUniswapV3SwapV1Description event={props.event} />;
	}
}
