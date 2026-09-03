import { ErrorBoundary } from "react-error-boundary";

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

	if (ids.length === 0) {
		return <StopCursorContainer startCursor={props.startCursor} stopCursor={null} />;
	}

	const events = await getEventsForIds(ids);
	const ordered = getOrderedEvents(events, "latest");

	const stopCursor = ids.length < 100 ? null : ordered[ordered.length - 1].id;

	return (
		<StopCursorContainer startCursor={props.startCursor} stopCursor={stopCursor}>
			<VirtualisationContainer>
				{ordered.map((event, i) => {
					const previous = ordered[i - 1];
					const previousId = previous === undefined ? props.startCursor : previous.id;

					return (
						<ErrorBoundary key={event.id} fallback={null}>
							<EventTableRow id={event.id} previousId={previousId}>
								<div className="px-3 py-1.5 overflow-hidden grow">
									<EventDescription event={event} address={props.address} />
								</div>

								<div className="px-3 py-1.5 overflow-hidden shrink-0">
									<EventTimestamp timestamp={new Date(parseId(event.id).blockTimestamp * 1000)} />
								</div>
							</EventTableRow>
						</ErrorBoundary>
					);
				})}
			</VirtualisationContainer>
		</StopCursorContainer>
	);
}

const ONE_DAY = 24 * 60 * 60 * 1000;

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
