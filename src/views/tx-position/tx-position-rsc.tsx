import clsx from "clsx";
import { ErrorBoundary } from "react-error-boundary";

import { getTx, type Tx } from "@/state/tx";
import { TRANSACTION_EVENT } from "@/constants";
import { EtherscanIcon } from "@/components/icons";
import { getOrderedEvents, parseId } from "@/helpers";
import { IconButton } from "@/components/icon-button";
import { getEventsForIds, type Event } from "@/db/events";
import { EventDescription } from "@/components/event-description";
import { RelativeTimestamp } from "@/components/relative-timestamp";
import { AddViewButton, CloseViewButton } from "@/components/views";
import { getEventIdsForTxPosition } from "@/indexes/block-number-tx-index-v4";
import { defined, formatDateTime, formatNumber, isHexEqual, numberToHex, raise } from "@/utils";

export async function TxPositionRsc(props: { block: number; tx: number }) {
	const [tx, ids] = await Promise.all([
		getTx({ block: props.block, tx: props.tx }),
		getEventIdsForTxPosition(1, props.block, props.tx),
	]);

	return (
		<div className="h-full flex flex-col bg-white">
			<Header tx={tx} />
			<Events ids={ids} />
		</div>
	);
}

function Header(props: { tx: Tx }) {
	return (
		<div>
			<div className="bg-white p-3 flex items-center justify-between gap-3">
				<div className="flex items-center gap-2 overflow-hidden">
					<p className="text-gray-900 font-semibold text-base select-all">Transaction</p>
					<p className="text-gray-500 text-base select-all truncate">{props.tx.hash}</p>
				</div>

				<div className="flex items-center gap-2">
					<IconButton href={`https://etherscan.io/tx/${props.tx.hash}`}>
						<EtherscanIcon className="shrink-0 size-4" />
					</IconButton>

					<CloseViewButton />
				</div>
			</div>
		</div>
	);
}

// Note that border-t on this element ensures that when no events show the header has a bottom border

function EmptyState() {
	return (
		<div className="border-t flex items-center justify-center h-128">
			<div className="flex flex-col gap-1 text-center max-w-xs">
				<p className="text-gray-900 text-sm font-medium">No events found</p>

				<p className="text-gray-500 text-sm">
					If this is a mistake, contact the founder and describe the event you expected to see
				</p>
			</div>
		</div>
	);
}

async function Events(props: { ids: string[] }) {
	if (props.ids.length === 0) {
		return <EmptyState />;
	}

	const events = await getEventsForIds(props.ids);

	const ordered = getOrderedEvents(events, "reverse");

	const event = events[0] || raise("Expected at least one event");
	const parsed = parseId(event.id);

	const timestamp = new Date(parsed.blockTimestamp * 1000);

	const intent = events.find((event) => {
		const { logIndex } = parseId(event.id);
		return isHexEqual(numberToHex(logIndex), TRANSACTION_EVENT);
	});

	return (
		<div className="relative overflow-scroll">
			<div className="px-3 pb-3">
				<div className="flex flex-col items-start gap-1">
					<div className="flex items-start justify-between">
						<p className="min-w-24 text-sm text-gray-700">Status</p>

						<p className={clsx("text-sm capitalize", event.success ? "text-green-500" : "text-red-500")}>
							{event.success ? "Success" : "Failed"}
						</p>
					</div>

					<div className="flex items-start justify-between">
						<p className="min-w-24 text-sm text-gray-700">Timestamp</p>

						<div className="flex items-center space-x-1 text-sm text-gray-900">
							<p className="flex-none">{formatDateTime(timestamp)}</p>

							<p className="flex-initial truncate">
								(<RelativeTimestamp timestamp={timestamp} />)
							</p>
						</div>
					</div>

					<div className="flex items-start justify-between">
						<p className="min-w-24 text-sm text-gray-700">Block #</p>

						<AddViewButton
							view={String(parsed.blockNumber)}
							className="text-sm text-gray-900 cursor-pointer -mx-px px-px rounded hover:bg-gray-200 data-[hovered=true]:bg-gray-200 select-none"
						>
							{formatNumber(parsed.blockNumber)}
						</AddViewButton>
					</div>

					<div className="flex items-start justify-between">
						<p className="min-w-24 text-sm text-gray-700">Tx Index</p>

						<p className="text-sm text-gray-900">{formatNumber(parsed.txIndex)}</p>
					</div>

					<div className="flex items-start justify-between">
						<p className="min-w-24 text-sm text-gray-700">Action</p>

						{defined(intent) && (
							<ErrorBoundary fallback={null}>
								<EventDescription event={intent} />
							</ErrorBoundary>
						)}
					</div>
				</div>
			</div>

			<div className="sticky top-0 border-t pb-3"></div>

			<Activity events={ordered} />
		</div>
	);
}

function Activity(props: { events: Event[] }) {
	const logs = props.events.filter((event) => {
		const { logIndex } = parseId(event.id);
		return !isHexEqual(numberToHex(logIndex), TRANSACTION_EVENT);
	});

	return (
		<div className="px-3 pb-3 flex flex-col gap-1">
			{logs.map((event) => {
				const { logIndex } = parseId(event.id);

				return (
					<ErrorBoundary key={event.id} fallback={null}>
						<div className="flex">
							<span className="text-sm text-gray-700 min-w-12">({formatNumber(logIndex)})</span>

							<EventDescription event={event} />
						</div>
					</ErrorBoundary>
				);
			})}
		</div>
	);
}
