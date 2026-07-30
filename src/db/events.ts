import { logger } from "@/utils";
import { getFwaWonV3 } from "@/events/fwa-won-v3/event";
import { getErc20ApprovalV3 } from "@/events/erc20-approval-v3/event";
import { getErc20TransferV3 } from "@/events/erc20-transfer-v3/event";
import { getUsdcBlacklistV3 } from "@/events/usdc-blacklist-v3/event";
import { getNativeTransferV3 } from "@/events/native-transfer-v3/event";
import { getErc721TransferV3 } from "@/events/erc721-transfer-v3/event";
import { getErc721ApprovalV3 } from "@/events/erc721-approval-v3/event";
import { getFwaNftDepositedV3 } from "@/events/fwa-nft-deposited-v3/event";
import { getCancelPendingTxV3 } from "@/events/cancel-pending-tx-v3/event";
import { getInputDataMessageV3 } from "@/events/input-data-message-v3/event";
import { getEnsNameRegisteredV3 } from "@/events/ens-name-registered-v3/event";
import { getContractDeploymentV3 } from "@/events/contract-deployment-v3/event";
import { getTornadoCashWithdrawalV3 } from "@/events/tornado-cash-withdrawal-v3/event";

// This is our central point of configuration for which all the events the app loads.

export type Event = Awaited<ReturnType<typeof getEventsForIds>>[number];

export async function getEventsForIds(ids: string[]) {
	const start = Date.now();

	const events = await Promise.all([
		getFwaWonV3(ids),
		getUsdcBlacklistV3(ids),
		getErc20TransferV3(ids),
		getErc20ApprovalV3(ids),
		getNativeTransferV3(ids),
		getErc721TransferV3(ids),
		getErc721ApprovalV3(ids),
		getFwaNftDepositedV3(ids),
		getCancelPendingTxV3(ids),
		getInputDataMessageV3(ids),
		getEnsNameRegisteredV3(ids),
		getContractDeploymentV3(ids),
		getTornadoCashWithdrawalV3(ids),
	]);

	const flat = events.flat(1);

	logger.debug(`Loaded ${flat.length} events in ${Date.now() - start}ms`);

	return flat;
}
