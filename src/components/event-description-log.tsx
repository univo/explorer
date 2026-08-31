import type { Event } from "@/db/events";
import { LogEnsNewOwnerV1Description } from "@/events/log_ens_new_owner_v1/component";
import { LogFwaNftListedV1Description } from "@/events/log_fwa_nft_listed_v1/component";
import { LogFwaNftAllocatedV1Description } from "@/events/log_fwa_nft_allocated_v1/component";
import { LogErc20TransferV1Description } from "@/events/log_erc20_transfer_v1/component";
import { LogErc20ApprovalV1Description } from "@/events/log_erc20_approval_v1/component";
import { LogUniswapV3SwapV1Description } from "@/events/log_uniswap_v3_swap_v1/component";
import { LogErc721TransferV1Description } from "@/events/log_erc721_transfer_v1/component";
import { LogErc721ApprovalV1Description } from "@/events/log_erc721_approval_v1/component";
import { LogEnsReverseClaimedV1Description } from "@/events/log_ens_reverse_claimed_v1/component";
import { LogUniswapV3PoolCreatedV1Description } from "@/events/log_uniswap_v3_pool_created_v1/component";
import { LogEnsNameForAddrChangedV1Description } from "@/events/log_ens_name_for_addr_changed_v1/component";

export function EventDescriptionLog(props: { event: Event }) {
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

	if (props.event.tag === "log_erc20_transfer_v1") {
		return <LogErc20TransferV1Description event={props.event} />;
	}

	if (props.event.tag === "log_erc721_transfer_v1") {
		return <LogErc721TransferV1Description event={props.event} />;
	}

	if (props.event.tag === "log_erc721_approval_v1") {
		return <LogErc721ApprovalV1Description event={props.event} />;
	}

	if (props.event.tag === "log_fwa_nft_listed_v1") {
		return <LogFwaNftListedV1Description event={props.event} />;
	}

	if (props.event.tag === "log_fwa_nft_allocated_v1") {
		return <LogFwaNftAllocatedV1Description event={props.event} />;
	}

	if (props.event.tag === "log_uniswap_v3_pool_created_v1") {
		return <LogUniswapV3PoolCreatedV1Description event={props.event} />;
	}

	if (props.event.tag === "log_uniswap_v3_swap_v1") {
		return <LogUniswapV3SwapV1Description event={props.event} />;
	}
}
