import { logger } from "@/utils";
import type { TABLES } from "./constants";
import { getIntentIdmV2 } from "@/events/intent_idm_v2/event";
import { getIntentFwaWonV3 } from "@/events/intent_fwa_won_v3/event";
import { getLogEnsNewOwnerV2 } from "@/events/log_ens_new_owner_v2/event";
import { getLogFwaNftListedV2 } from "@/events/log_fwa_nft_listed_v2/event";
import { getLogErc20TransferV2 } from "@/events/log_erc20_transfer_v2/event";
import { getLogErc20ApprovalV2 } from "@/events/log_erc20_approval_v2/event";
import { getIntentFwaAcquireV2 } from "@/events/intent_fwa_acquire_v2/event";
import { getLogUniswapV3SwapV2 } from "@/events/log_uniswap_v3_swap_v2/event";
import { getLogErc721TransferV2 } from "@/events/log_erc721_transfer_v2/event";
import { getLogErc721ApprovalV2 } from "@/events/log_erc721_approval_v2/event";
import { getIntentAaveV3RepayV2 } from "@/events/intent_aave_v3_repay_v2/event";
import { getIntentFwaDepositedV2 } from "@/events/intent_fwa_deposited_v2/event";
import { getIntentAaveV3SupplyV2 } from "@/events/intent_aave_v3_supply_v2/event";
import { getLogFwaNftAllocatedV2 } from "@/events/log_fwa_nft_allocated_v2/event";
import { getIntentAaveV3BorrowV2 } from "@/events/intent_aave_v3_borrow_v2/event";
import { getIntentErc20ApprovalV2 } from "@/events/intent_erc20_approval_v2/event";
import { getIntentErc20TransferV2 } from "@/events/intent_erc20_transfer_v2/event";
import { getIntentUsdcBlacklistV2 } from "@/events/intent_usdc_blacklist_v2/event";
import { getIntentUniswapV3SwapV2 } from "@/events/intent_uniswap_v3_swap_v2/event";
import { getIntentUniswapV3MintV2 } from "@/events/intent_uniswap_v3_mint_v2/event";
import { getIntentErc721ApprovalV2 } from "@/events/intent_erc721_approval_v2/event";
import { getIntentErc721TransferV2 } from "@/events/intent_erc721_transfer_v2/event";
import { getIntentNativeTransferV2 } from "@/events/intent_native_transfer_v2/event";
import { getLogEnsReverseClaimedV2 } from "@/events/log_ens_reverse_claimed_v2/event";
import { getIntentAaveV3WithdrawV2 } from "@/events/intent_aave_v3_withdraw_v2/event";
import { getIntentCancelPendingTxV2 } from "@/events/intent_cancel_pending_tx_v2/event";
import { getIntentTornadoWithdrawalV2 } from "@/events/intent_tornado_withdrawal_v2/event";
import { getIntentEnsNameRegisteredV2 } from "@/events/intent_ens_name_registered_v2/event";
import { getLogUniswapV3PoolCreatedV2 } from "@/events/log_uniswap_v3_pool_created_v2/event";
import { getIntentContractDeploymentV2 } from "@/events/intent_contract_deployment_v2/event";
import { getLogEnsNameForAddrChangedV2 } from "@/events/log_ens_name_for_addr_changed_v2/event";

export type Event = {
	tag: keyof typeof TABLES;
	chain: number;
	tx_index: number;
	log_index: number;
	block_number: number;
	block_timestamp: Date;
};

export async function getEvents(events: Event[]) {
	if (events.length === 0) {
		return [];
	}

	const start = Date.now();

	const results = await Promise.all([
		getLogEnsNewOwnerV2(events),
		getLogFwaNftListedV2(events),
		getLogErc20ApprovalV2(events),
		getLogErc20TransferV2(events),
		getLogUniswapV3SwapV2(events),
		getLogErc721ApprovalV2(events),
		getLogErc721TransferV2(events),
		getLogFwaNftAllocatedV2(events),
		getLogEnsReverseClaimedV2(events),
		getLogUniswapV3PoolCreatedV2(events),
		getLogEnsNameForAddrChangedV2(events),

		getIntentIdmV2(events),
		getIntentFwaWonV3(events),
		getIntentFwaAcquireV2(events),
		getIntentAaveV3RepayV2(events),
		getIntentFwaDepositedV2(events),
		getIntentAaveV3SupplyV2(events),
		getIntentAaveV3BorrowV2(events),
		getIntentErc20ApprovalV2(events),
		getIntentErc20TransferV2(events),
		getIntentUsdcBlacklistV2(events),
		getIntentUniswapV3SwapV2(events),
		getIntentUniswapV3MintV2(events),
		getIntentErc721ApprovalV2(events),
		getIntentErc721TransferV2(events),
		getIntentAaveV3WithdrawV2(events),
		getIntentNativeTransferV2(events),
		getIntentCancelPendingTxV2(events),
		getIntentTornadoWithdrawalV2(events),
		getIntentEnsNameRegisteredV2(events),
		getIntentContractDeploymentV2(events),
	]);

	const flat = results.flat(1);

	logger.debug(`Loaded ${flat.length} events in ${Date.now() - start}ms`);

	return flat;
}
