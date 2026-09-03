import clsx from "clsx";
import { ErrorBoundary } from "react-error-boundary";

import { raise } from "@/utils";
import { getEventsForIds } from "@/db/events";
import { Timestamp } from "@/components/timestamp";
import { getOrderedEvents, parseId } from "@/helpers";
import { EventTableRow } from "@/components/event-table-row";
import { getEventIdsForAccount } from "@/indexes/account-v3";
import { EventDescription } from "@/components/event-description";
import { RelativeTimestamp } from "@/components/relative-timestamp";
import { StopCursorContainer, VirtualisationContainer } from "@/frames/address/address-client";

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
	const firstEventDay = firstEventDate.toLocaleDateString("en", { day: "numeric" });
	const previousBatchLastEventDay = previousBatchLastEventDate.toLocaleDateString("en", { day: "numeric" });
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

						const eventString = eventDate.toLocaleDateString("en", { day: "numeric" });
						const previousString = previousDate.toLocaleDateString("en", { day: "numeric" });
						const showHeader = eventString !== previousString;

						return (
							<ErrorBoundary key={event.id} fallback={null}>
								{showHeader && (
									<div className="flex items-center justify-between px-3 h-8 bg-gray-100 sticky top-0 z-10">
										<p className="text-sm text-gray-500 font-normal text-nowrap select-all">
											<Timestamp date utc={eventDate} />
										</p>

										<HeaderTimestamp timestamp={eventDate} />
									</div>
								)}

								<div className={clsx(showHeader === false && "not-first:border-t not-first:border-gray-200")}>
									<EventTableRow id={event.id}>
										<div className="px-3 py-1.5 overflow-hidden grow">
											<EventDescription event={event} address={props.address} />
										</div>

										<div className="px-3 py-1.5 overflow-hidden shrink-0">
											<EventTimestamp timestamp={eventDate} />
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
				<RelativeTimestamp utc={props.timestamp} />
			</p>
		);
	}
}

function EventTimestamp(props: { timestamp: Date }) {
	const delta = Date.now() - props.timestamp.getTime();

	if (delta > ONE_DAY) {
		return (
			<p className="text-sm text-gray-500 text-right text-nowrap select-all">
				<Timestamp time utc={props.timestamp} />
			</p>
		);
	}

	// Relative timestamps update change width over time so we force a width here

	return (
		<p className="text-sm text-gray-500 text-right text-nowrap select-all min-w-8">
			<RelativeTimestamp utc={props.timestamp} />
		</p>
	);
}
