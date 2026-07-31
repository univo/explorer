import type { Event } from "@/db/events";
import { UsdcBlacklistV3AccountDescription } from "@/events/usdc-blacklist-v3/component";
import { Erc20ApprovalV3AccountDescription } from "@/events/erc20-approval-v3/component";
import { Erc20TransferV3AccountDescription } from "@/events/erc20-transfer-v3/component";
import { NativeTransferV3AccountDescription } from "@/events/native-transfer-v3/component";
import { Erc721TransferV3AccountDescription } from "@/events/erc721-transfer-v3/component";
import { Erc721ApprovalV3AccountDescription } from "@/events/erc721-approval-v3/component";
import { CancelPendingTxV3AccountDescription } from "@/events/cancel-pending-tx-v3/component";
import { InputDataMessageV3AccountDescription } from "@/events/input-data-message-v3/component";
import { EnsNameRegisteredV3AccountDescription } from "@/events/ens-name-registered-v3/component";
import { ContractDeploymentV3AccountDescription } from "@/events/contract-deployment-v3/component";
import { TornadoCashWithdrawalV3AccountDescription } from "@/events/tornado-cash-withdrawal-v3/component";

export function EventDescriptionAccount(props: { address: `0x${string}`; event: Event }) {
	if (props.event.tag === "erc20_approval_v3") {
		return <Erc20ApprovalV3AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "native_transfer_v3") {
		return <NativeTransferV3AccountDescription event={props.event} address={props.address} />;
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

	if (props.event.tag === "contract_deployment_v3") {
		return <ContractDeploymentV3AccountDescription event={props.event} address={props.address} />;
	}

	if (props.event.tag === "cancel_pending_tx_v3") {
		return <CancelPendingTxV3AccountDescription event={props.event} address={props.address} />;
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
}
