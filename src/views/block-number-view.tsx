import { useSuspenseQuery } from "@tanstack/react-query";
import { createFromFetch } from "@tanstack/react-start/rsc";

import { formatNumber, raise } from "@/utils";
import { EtherscanIcon } from "@/components/icons";
import { getBlock, type Block } from "@/state/block";
import { CloseViewButton } from "@/components/views";
import { IconButton } from "@/components/icon-button";
import { getEventsForIds, type Event } from "@/db/events";
import { EventTableRow } from "@/components/event-table-row";
import { RelativeTimestamp } from "@/components/relative-timestamp";
import { getEventIdsForBlockNumber } from "@/indexes/block-number-v2";
import { getOrderedEvents, groupEventsByDay, parseId } from "@/helpers";
import { Erc20ApprovalV1Description } from "@/events/erc20-approval-v1/component";
import { Erc20TransferV1Description } from "@/events/erc20-transfer-v1/component";
import { Erc721ApprovalV1Description } from "@/events/erc721-approval-v1/component";
import { Erc721TransferV1Description } from "@/events/erc721-transfer-v1/component";
import { NativeTransferV1Description } from "@/events/native-transfer-v1/component";
import { CancelPendingTxV1Description } from "@/events/cancel-pending-tx-v1/component";
import { InputDataMessageV1Description } from "@/events/input-data-message-v1/component";
import { Table, TableBody, TableData, TableHead, TableHeading } from "@/components/table";
import { EnsNameRegisteredV1Description } from "@/events/ens-name-registered-v1/component";
import { ContractDeploymentV1Description } from "@/events/contract-deployment-v1/component";

export function BlockNumberViewSuspense(props: { view: string }) {
	const query = useSuspenseQuery({
		queryKey: ["block-number", props.view],
		queryFn: () => createFromFetch(fetch(`/api/block-number/${props.view}`)),
	});

	return query.data;
}

export async function BlockNumberView(props: { number: number }) {
	const [block, ids] = await Promise.all([
		getBlock(props.number), //
		getEventIdsForBlockNumber(1, props.number),
	]);

	return (
		<div className="h-full flex flex-col bg-white">
			<Header block={block} />
			<EventsTable ids={ids} />
		</div>
	);
}

function Header(props: { block: Block }) {
	return (
		<div className="bg-white px-3 py-3 flex items-center justify-between">
			<div className="flex items-center gap-2 overflow-hidden">
				<p className="text-gray-900 font-semibold text-base select-all">Block</p>
				<p className="text-gray-500 text-base select-all truncate">{formatNumber(props.block.number)}</p>
			</div>

			<div className="flex items-center gap-2">
				<IconButton href={`https://etherscan.io/block/${props.block.number}`}>
					<EtherscanIcon className="shrink-0 size-4" />
				</IconButton>

				<CloseViewButton view={String(props.block.number)} />
			</div>
		</div>
	);
}

async function EventsTable(props: { ids: string[] }) {
	if (props.ids.length === 0) {
		return (
			<div className="flex items-center justify-center h-128">
				<div className="flex flex-col gap-1 text-center max-w-xs">
					<p className="text-gray-900 text-sm font-medium">No events found</p>

					<p className="text-gray-500 text-sm">
						If this is a mistake, contact the founder and describe the event you expected to see
					</p>
				</div>
			</div>
		);
	}

	const events = await getEventsForIds(props.ids);
	const ordered = getOrderedEvents(events, "latest");
	const grouped = groupEventsByDay(ordered);

	return (
		<div className="relative grow overflow-scroll isolate">
			{Object.entries(grouped).map(([date, events]) => {
				if (events === undefined) throw new Error();

				const event = events[0] || raise("Expected at least one event per group");
				const { block_timestamp } = parseId(event.id);

				return (
					<Table key={date}>
						<TableHead className="sticky top-0 z-10">
							<TableHeading>
								<div className="flex items-center justify-between">
									<p className="text-sm text-gray-500 font-normal text-nowrap select-all">{date}</p>

									<p className="text-sm text-gray-500 font-normal text-nowrap select-all">
										<RelativeTimestamp timestamp={new Date(block_timestamp * 1000)} />
									</p>
								</div>
							</TableHeading>
						</TableHead>

						<TableBody>
							{ordered.map((event) => {
								return (
									<EventTableRow key={event.id} id={event.id}>
										<TableData>
											<EventDescription event={event} />
										</TableData>
									</EventTableRow>
								);
							})}
						</TableBody>
					</Table>
				);
			})}

			<div className="flex items-center justify-center py-8">
				<p className="text-gray-500 text-sm">No more events</p>
			</div>
		</div>
	);
}

export function EventDescription(props: { event: Event }) {
	if (props.event.tag === "erc20_approval_v1") {
		return <Erc20ApprovalV1Description event={props.event} />;
	}

	if (props.event.tag === "native_transfer_v1") {
		return <NativeTransferV1Description event={props.event} />;
	}

	if (props.event.tag === "erc20_transfer_v1") {
		return <Erc20TransferV1Description event={props.event} />;
	}

	if (props.event.tag === "input_data_message_v1") {
		return <InputDataMessageV1Description event={props.event} />;
	}

	if (props.event.tag === "ens_name_registered_v1") {
		return <EnsNameRegisteredV1Description event={props.event} />;
	}

	if (props.event.tag === "contract_deployment_v1") {
		return <ContractDeploymentV1Description event={props.event} />;
	}

	if (props.event.tag === "cancel_pending_tx_v1") {
		return <CancelPendingTxV1Description event={props.event} />;
	}

	if (props.event.tag === "erc721_transfer_v1") {
		return <Erc721TransferV1Description event={props.event} />;
	}

	if (props.event.tag === "erc721_approval_v1") {
		return <Erc721ApprovalV1Description event={props.event} />;
	}
}
