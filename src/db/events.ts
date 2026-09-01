import { logger } from "@/utils";
import { getIntentIdmV1 } from "@/events/intent_idm_v1/event";
import { getIntentFwaWonV1 } from "@/events/intent_fwa_won_v1/event";
import { getIntentFwaWonV2 } from "@/events/intent_fwa_won_v2/event";
import { getIntentFwaAcquireV1 } from "@/events/intent_fwa_acquire_v1/event";
import { getLogEnsNewOwnerV1 } from "@/events/log_ens_new_owner_v1/event";
import { getLogFwaNftListedV1 } from "@/events/log_fwa_nft_listed_v1/event";
import { getLogFwaNftAllocatedV1 } from "@/events/log_fwa_nft_allocated_v1/event";
import { getLogErc20TransferV1 } from "@/events/log_erc20_transfer_v1/event";
import { getLogErc20ApprovalV1 } from "@/events/log_erc20_approval_v1/event";
import { getLogUniswapV3SwapV1 } from "@/events/log_uniswap_v3_swap_v1/event";
import { getLogErc721TransferV1 } from "@/events/log_erc721_transfer_v1/event";
import { getLogErc721ApprovalV1 } from "@/events/log_erc721_approval_v1/event";
import { getIntentAaveV3RepayV1 } from "@/events/intent_aave_v3_repay_v1/event";
import { getIntentFwaDepositedV1 } from "@/events/intent_fwa_deposited_v1/event";
import { getIntentAaveV3SupplyV1 } from "@/events/intent_aave_v3_supply_v1/event";
import { getIntentAaveV3BorrowV1 } from "@/events/intent_aave_v3_borrow_v1/event";
import { getIntentErc20ApprovalV1 } from "@/events/intent_erc20_approval_v1/event";
import { getIntentErc20TransferV1 } from "@/events/intent_erc20_transfer_v1/event";
import { getIntentUsdcBlacklistV1 } from "@/events/intent_usdc_blacklist_v1/event";
import { getIntentUniswapV3SwapV1 } from "@/events/intent_uniswap_v3_swap_v1/event";
import { getIntentUniswapV3MintV1 } from "@/events/intent_uniswap_v3_mint_v1/event";
import { getIntentErc721ApprovalV1 } from "@/events/intent_erc721_approval_v1/event";
import { getIntentErc721TransferV1 } from "@/events/intent_erc721_transfer_v1/event";
import { getIntentNativeTransferV1 } from "@/events/intent_native_transfer_v1/event";
import { getLogEnsReverseClaimedV1 } from "@/events/log_ens_reverse_claimed_v1/event";
import { getIntentAaveV3WithdrawV1 } from "@/events/intent_aave_v3_withdraw_v1/event";
import { getIntentCancelPendingTxV1 } from "@/events/intent_cancel_pending_tx_v1/event";
import { getIntentTornadoWithdrawalV1 } from "@/events/intent_tornado_withdrawal_v1/event";
import { getIntentEnsNameRegisteredV1 } from "@/events/intent_ens_name_registered_v1/event";
import { getLogUniswapV3PoolCreatedV1 } from "@/events/log_uniswap_v3_pool_created_v1/event";
import { getIntentContractDeploymentV1 } from "@/events/intent_contract_deployment_v1/event";
import { getLogEnsNameForAddrChangedV1 } from "@/events/log_ens_name_for_addr_changed_v1/event";

// This is our central point of configuration for which all the events the app loads.

export type Event = Awaited<ReturnType<typeof getEventsForIds>>[number];

export async function getEventsForIds(ids: string[]) {
	if (ids.length === 0) {
		return [];
	}

	const start = Date.now();

	const events = await Promise.all([
		getLogEnsNewOwnerV1(ids),
		getLogFwaNftListedV1(ids),
		getLogErc20ApprovalV1(ids),
		getLogErc20TransferV1(ids),
		getLogUniswapV3SwapV1(ids),
		getLogErc721ApprovalV1(ids),
		getLogErc721TransferV1(ids),
		getLogFwaNftAllocatedV1(ids),
		getLogEnsReverseClaimedV1(ids),
		getLogUniswapV3PoolCreatedV1(ids),
		getLogEnsNameForAddrChangedV1(ids),

		getIntentIdmV1(ids),
		getIntentFwaWonV1(ids),
		getIntentFwaWonV2(ids),
		getIntentFwaAcquireV1(ids),
		getIntentAaveV3RepayV1(ids),
		getIntentFwaDepositedV1(ids),
		getIntentAaveV3SupplyV1(ids),
		getIntentAaveV3BorrowV1(ids),
		getIntentErc20ApprovalV1(ids),
		getIntentErc20TransferV1(ids),
		getIntentUsdcBlacklistV1(ids),
		getIntentUniswapV3SwapV1(ids),
		getIntentUniswapV3MintV1(ids),
		getIntentErc721ApprovalV1(ids),
		getIntentErc721TransferV1(ids),
		getIntentAaveV3WithdrawV1(ids),
		getIntentNativeTransferV1(ids),
		getIntentCancelPendingTxV1(ids),
		getIntentTornadoWithdrawalV1(ids),
		getIntentEnsNameRegisteredV1(ids),
		getIntentContractDeploymentV1(ids),
	]);

	const flat = events.flat(1);

	logger.debug(`Loaded ${flat.length} events in ${Date.now() - start}ms`);

	return flat;
}
