import type { Event } from "@/db/events";
import { IntentFwaWonV1AccountDescription } from "@/events/intent_fwa_won_v1/component";
import { LogFwaNftListedV1Description } from "@/events/log_fwa_nft_listed_v1/component";
import { UsdcBlacklistV3AccountDescription } from "@/events/usdc-blacklist-v3/component";
import { Erc20ApprovalV3AccountDescription } from "@/events/erc20-approval-v3/component";
import { Erc20TransferV3AccountDescription } from "@/events/erc20-transfer-v3/component";
import { Erc721TransferV3AccountDescription } from "@/events/erc721-transfer-v3/component";
import { Erc721ApprovalV3AccountDescription } from "@/events/erc721-approval-v3/component";
import { InputDataMessageV3AccountDescription } from "@/events/input-data-message-v3/component";
import { EnsNameRegisteredV3AccountDescription } from "@/events/ens-name-registered-v3/component";
import { IntentAaveV3RepayV1AccountDescription } from "@/events/intent_aave_v3_repay_v1/component";
import { IntentFwaDepositedV1AccountDescription } from "@/events/intent_fwa_deposited_v1/component";
import { IntentAaveV3SupplyV1AccountDescription } from "@/events/intent_aave_v3_supply_v1/component";
import { IntentAaveV3BorrowV1AccountDescription } from "@/events/intent_aave_v3_borrow_v1/component";
import { IntentUniswapV3SwapV1AccountDescription } from "@/events/intent_uniswap_v3_swap_v1/component";
import { IntentUniswapV3MintV1AccountDescription } from "@/events/intent_uniswap_v3_mint_v1/component";
import { IntentNativeTransferV1AccountDescription } from "@/events/intent_native_transfer_v1/component";
import { IntentAaveV3WithdrawV1AccountDescription } from "@/events/intent_aave_v3_withdraw_v1/component";
import { TornadoCashWithdrawalV3AccountDescription } from "@/events/tornado-cash-withdrawal-v3/component";
import { IntentCancelPendingTxV1AccountDescription } from "@/events/intent_cancel_pending_tx_v1/component";
import { IntentContractDeploymentV1AccountDescription } from "@/events/intent_contract_deployment_v1/component";

export function EventDescriptionAccount(props: { address: `0x${string}`; event: Event }) {
	if (props.event.tag === "erc20_approval_v3") {
		return <Erc20ApprovalV3AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_native_transfer_v1") {
		return <IntentNativeTransferV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "erc20_transfer_v3") {
		return <Erc20TransferV3AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "input_data_message_v3") {
		return <InputDataMessageV3AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "ens_name_registered_v3") {
		return <EnsNameRegisteredV3AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_contract_deployment_v1") {
		return <IntentContractDeploymentV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_cancel_pending_tx_v1") {
		return <IntentCancelPendingTxV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "erc721_transfer_v3") {
		return <Erc721TransferV3AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "erc721_approval_v3") {
		return <Erc721ApprovalV3AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "tornado_cash_withdrawal_v3") {
		return <TornadoCashWithdrawalV3AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "usdc_blacklist_v3") {
		return <UsdcBlacklistV3AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_fwa_deposited_v1") {
		return <IntentFwaDepositedV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "intent_fwa_won_v1") {
		return <IntentFwaWonV1AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "log_fwa_nft_listed_v1") {
		return <LogFwaNftListedV1Description event={props.event} />;
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
}
