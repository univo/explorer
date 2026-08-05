import clsx from "clsx";
import { ErrorBoundary } from "react-error-boundary";

import { raise } from "@/utils";
import { getEventsForIds } from "@/db/events";
import { getOrderedEvents, parseId } from "@/helpers";
import { EventTableRow } from "@/components/event-table-row";
import { getEventIdsForAccount } from "@/indexes/account-v3";
import { RelativeTimestamp } from "@/components/relative-timestamp";
import { formatDay, formatRelativeDate, formatTime } from "@/utils";
import { EventDescriptionAccount } from "@/components/event-description-account";
import { StopCursorContainer, VirtualisationContainer } from "@/views/address/address-client";

export async function AddressEventsRsc(props: { address: `0x${string}`; startCursor: string }) {
	const ids = await getEventIdsForAccount(props.address, {
		limit: 100,
		order: "latest",
		cursor: props.startCursor,
	});

	// This is pretty rare ands means the last batch fetched exactly the last 100 events
	// or the account itself has no events recorded

	if (ids.length === 0) {
		return <StopCursorContainer startCursor={props.startCursor} stopCursor={null} />;
	}

	const events = await getEventsForIds(ids);
	const ordered = getOrderedEvents(events, "latest");

	// Determine if this batch starts with a header. We have to do this to implement the top
	// border for the batch because we wrap each batch in a virtualisation container. So we
	// need each viritualisation container to also manage it's top border (excluding the first)

	const firstEvent = ordered[0] || raise("Expected at least one event");
	const firstEventDate = new Date(parseId(firstEvent.id).blockTimestamp * 1000);
	const previousBatchLastEventDate = new Date(parseId(props.startCursor).blockTimestamp * 1000);
	const firstEventDay = formatDay(firstEventDate);
	const previousBatchLastEventDay = formatDay(previousBatchLastEventDate);
	const startsWithHeader = previousBatchLastEventDay !== firstEventDay;

	const stopCursor = ids.length < 100 ? null : ordered[ordered.length - 1].id;

	return (
		<StopCursorContainer startCursor={props.startCursor} stopCursor={stopCursor}>
			<div className={clsx(startsWithHeader === false && "not-first:border-t not-first:border-gray-200")}>
				<VirtualisationContainer>
					{ordered.map((event, i) => {
						const previous = ordered[i - 1];
						const previousId = previous === undefined ? props.startCursor : previous.id;

						const eventDate = new Date(parseId(event.id).blockTimestamp * 1000);
						const previousDate = new Date(parseId(previousId).blockTimestamp * 1000);

						const eventString = formatDay(eventDate);
						const previousString = formatDay(previousDate);

						const showHeader = eventString !== previousString;

						return (
							<ErrorBoundary key={event.id} fallback={null}>
								{showHeader && (
									<div className="flex items-center justify-between px-3 h-8 bg-gray-100 sticky top-0 z-10">
										<p className="text-sm text-gray-500 font-normal text-nowrap select-all">{eventString}</p>
										<HeaderTimestamp timestamp={eventDate} />
									</div>
								)}

								<div className={clsx(showHeader === false && "not-first:border-t not-first:border-gray-200")}>
									<EventTableRow id={event.id}>
										<div className="px-3 py-1.5 overflow-hidden grow">
											<EventDescriptionAccount address={props.address} event={event} />
										</div>

										<div className="px-3 py-1.5 overflow-hidden shrink-0">
											<EventTimestamp timestamp={new Date(parseId(event.id).blockTimestamp * 1000)} />
										</div>
									</EventTableRow>
								</div>
							</ErrorBoundary>
						);
					})}
				</VirtualisationContainer>
			</div>
		</StopCursorContainer>
	);
}

const ONE_DAY = 24 * 60 * 60 * 1000;

function HeaderTimestamp(props: { timestamp: Date }) {
	const delta = Date.now() - props.timestamp.getTime();

	if (delta > ONE_DAY) {
		return (
			<p className="text-sm text-gray-500 font-normal text-nowrap select-all text-right">
				{formatRelativeDate(props.timestamp)}
			</p>
		);
	}
}

function EventTimestamp(props: { timestamp: Date }) {
	const delta = Date.now() - props.timestamp.getTime();

	if (delta > ONE_DAY) {
		// TODO: This is currently in UTC and should be localised
		return <p className="text-sm text-gray-500 text-right text-nowrap select-all">{formatTime(props.timestamp)}</p>;
	}

	// Relative timestamps update change width over time so we force a width here

	return (
		<p className="text-sm text-gray-500 text-right text-nowrap select-all min-w-8">
			<RelativeTimestamp timestamp={props.timestamp} />
		</p>
	);
}
