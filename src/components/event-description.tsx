import type { Event } from "@/db/events";
import { FwaWonV3Description } from "@/events/fwa-won-v3/component";
import { FwaNftListedV3Description } from "@/events/fwa-nft-listed-v3/component";
import { Erc20ApprovalV3Description } from "@/events/erc20-approval-v3/component";
import { Erc20TransferV3Description } from "@/events/erc20-transfer-v3/component";
import { UsdcBlacklistV3Description } from "@/events/usdc-blacklist-v3/component";
import { Erc721ApprovalV3Description } from "@/events/erc721-approval-v3/component";
import { Erc721TransferV3Description } from "@/events/erc721-transfer-v3/component";
import { NativeTransferV3Description } from "@/events/native-transfer-v3/component";
import { CancelPendingTxV3Description } from "@/events/cancel-pending-tx-v3/component";
import { FwaNftDepositedV3Description } from "@/events/fwa-nft-deposited-v3/component";
import { InputDataMessageV3Description } from "@/events/input-data-message-v3/component";
import { EnsNameRegisteredV3Description } from "@/events/ens-name-registered-v3/component";
import { ContractDeploymentV3Description } from "@/events/contract-deployment-v3/component";
import { TornadoCashWithdrawalV3Description } from "@/events/tornado-cash-withdrawal-v3/component";

export function EventDescription(props: { event: Event }) {
	if (props.event.tag === "erc20_approval_v3") {
		return <Erc20ApprovalV3Description event={props.event} />;
	}

	if (props.event.tag === "native_transfer_v3") {
		return <NativeTransferV3Description event={props.event} />;
	}

	if (props.event.tag === "erc20_transfer_v3") {
		return <Erc20TransferV3Description event={props.event} />;
	}

	if (props.event.tag === "input_data_message_v3") {
		return <InputDataMessageV3Description event={props.event} />;
	}

	if (props.event.tag === "ens_name_registered_v3") {
		return <EnsNameRegisteredV3Description event={props.event} />;
	}

	if (props.event.tag === "contract_deployment_v3") {
		return <ContractDeploymentV3Description event={props.event} />;
	}

	if (props.event.tag === "cancel_pending_tx_v3") {
		return <CancelPendingTxV3Description event={props.event} />;
	}

	if (props.event.tag === "erc721_transfer_v3") {
		return <Erc721TransferV3Description event={props.event} />;
	}

	if (props.event.tag === "erc721_approval_v3") {
		return <Erc721ApprovalV3Description event={props.event} />;
	}

	if (props.event.tag === "tornado_cash_withdrawal_v3") {
		return <TornadoCashWithdrawalV3Description event={props.event} />;
	}

	if (props.event.tag === "usdc_blacklist_v3") {
		return <UsdcBlacklistV3Description event={props.event} />;
	}

	if (props.event.tag === "fwa_nft_deposited_v3") {
		return <FwaNftDepositedV3Description event={props.event} />;
	}

	if (props.event.tag === "fwa_nft_listed_v3") {
		return <FwaNftListedV3Description event={props.event} />;
	}

	if (props.event.tag === "fwa_won_v3") {
		return <FwaWonV3Description event={props.event} />;
	}
}
