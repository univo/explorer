import { ErrorBoundary } from "react-error-boundary";

import type { Block } from "@/state/block";
import { getOrderedEvents } from "@/helpers";
import { getEventsForIds } from "@/db/events";
import { getBlockByNumber } from "@/state/block";
import { EtherscanIcon } from "@/components/icons";
import { formatNumber, hexToNumber } from "@/utils";
import { IconButton } from "@/components/icon-button";
import { CloseFrameButton } from "@/components/frames";
import { EventTableRow } from "@/components/event-table-row";
import { EventDescription } from "@/components/event-description";
import { getEventIdsForBlockNumber } from "@/indexes/block-number-tx-index-v4";

// TODO: Add timestamp to header and include other block info

export async function BlockNumberRsc(props: { number: number }) {
	const [block, ids] = await Promise.all([
		getBlockByNumber(props.number), //
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
		<div className="border-b border-gray-200 bg-white px-3 py-3 flex items-center justify-between">
			<div className="flex items-center gap-2 overflow-hidden">
				<p className="text-gray-900 font-semibold text-base select-all">Block</p>
				<p className="text-gray-500 text-base select-all truncate">{formatNumber(hexToNumber(props.block.number as string))}</p>
			</div>

			<div className="flex items-center gap-2">
				<IconButton href={`https://etherscan.io/block/${props.block.number}`}>
					<EtherscanIcon className="shrink-0 size-4" />
				</IconButton>

				<CloseFrameButton />
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

					<p className="text-gray-500 text-sm">If this is a mistake, contact the founder and describe the event you expected to see</p>
				</div>
			</div>
		);
	}

	const events = await getEventsForIds(props.ids);
	const ordered = getOrderedEvents(events, "latest");

	return (
		<div className="relative grow overflow-scroll isolate">
			{ordered.map((event) => {
				return (
					<ErrorBoundary key={event.id} fallback={null}>
						<div className="border-b border-gray-200">
							<EventTableRow id={event.id}>
								<div className="px-3 py-1.5 overflow-hidden grow">
									<EventDescription event={event} address={undefined} />
								</div>
							</EventTableRow>
						</div>
					</ErrorBoundary>
				);
			})}

			<div className="flex items-center justify-center h-16">
				<p className="text-gray-500 text-sm">No more events</p>
			</div>
		</div>
	);
}
