import { logger } from "@/utils";
import { getErc20ApprovalV1 } from "@/events/erc20-approval-v1/event";
import { getErc20TransferV1 } from "@/events/erc20-transfer-v1/event";
import { getNativeTransferV1 } from "@/events/native-transfer-v1/event";
import { getErc721TransferV1 } from "@/events/erc721-transfer-v1/event";
import { getErc721ApprovalV1 } from "@/events/erc721-approval-v1/event";
import { getCancelPendingTxV1 } from "@/events/cancel-pending-tx-v1/event";
import { getInputDataMessageV1 } from "@/events/input-data-message-v1/event";
import { getEnsNameRegisteredV1 } from "@/events/ens-name-registered-v1/event";
import { getContractDeploymentV1 } from "@/events/contract-deployment-v1/event";

// This is our central point of configuration for which all the events the app loads.

export type Event = Awaited<ReturnType<typeof getEventsForIds>>[number];

export async function getEventsForIds(ids: string[]) {
	const start = Date.now();

	const events = await Promise.all([
		getNativeTransferV1(ids),
		getErc20TransferV1(ids),
		getErc20ApprovalV1(ids),
		getInputDataMessageV1(ids),
		getContractDeploymentV1(ids),
		getEnsNameRegisteredV1(ids),
		getCancelPendingTxV1(ids),
		getErc721TransferV1(ids),
		getErc721ApprovalV1(ids),
	]);

	const flat = events.flat(1);

	logger.debug(`Loaded ${flat.length} events in ${Date.now() - start}ms`);

	return flat;
}
