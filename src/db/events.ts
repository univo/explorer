import { logger } from "@/utils";
import { getErc20ApprovalV2 } from "@/events/erc20-approval-v2/event";
import { getErc20TransferV2 } from "@/events/erc20-transfer-v2/event";
import { getNativeTransferV2 } from "@/events/native-transfer-v2/event";
import { getErc721TransferV2 } from "@/events/erc721-transfer-v2/event";
import { getErc721ApprovalV2 } from "@/events/erc721-approval-v2/event";
import { getCancelPendingTxV2 } from "@/events/cancel-pending-tx-v2/event";
import { getInputDataMessageV2 } from "@/events/input-data-message-v2/event";
import { getEnsNameRegisteredV3 } from "@/events/ens-name-registered-v3/event";
import { getContractDeploymentV3 } from "@/events/contract-deployment-v3/event";

// This is our central point of configuration for which all the events the app loads.

export type Event = Awaited<ReturnType<typeof getEventsForIds>>[number];

export async function getEventsForIds(ids: string[]) {
	const start = Date.now();

	const events = await Promise.all([
		getNativeTransferV2(ids),
		getErc20TransferV2(ids),
		getErc20ApprovalV2(ids),
		getInputDataMessageV2(ids),
		getContractDeploymentV3(ids),
		getEnsNameRegisteredV3(ids),
		getCancelPendingTxV2(ids),
		getErc721TransferV2(ids),
		getErc721ApprovalV2(ids),
	]);

	const flat = events.flat(1);

	logger.debug(`Loaded ${flat.length} events in ${Date.now() - start}ms`);

	return flat;
}
