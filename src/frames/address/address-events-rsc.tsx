import { ErrorBoundary } from "react-error-boundary";

import { PRESETS } from "@/constants";
import type { Preset } from "@/constants";
import { getEventsForIds } from "@/events";
import { getOrderedEvents } from "@/helpers";
import { deserializeCursor, serializeCursor } from "./cursor";
import { Timestamp } from "@/components/timestamp";
import { EventTableRow } from "@/components/event-table-row";
import { EventDescription } from "@/components/event-description";
import { getEventIdsForAccount } from "@/indexes/index_account_v4";
import { RelativeTimestamp } from "@/components/relative-timestamp";
import { StopCursorContainer, VirtualisationContainer } from "@/frames/address/address-client";

export async function AddressEventsRsc(props: { address: `0x${string}`; preset: Preset; startCursor: string }) {
	const ids = await getEventIdsForAccount(props.address, {
		limit: 100,
		chains: [1],
		order: "latest",
		tables: PRESETS[props.preset],
		cursor: deserializeCursor(props.startCursor),
	});

	if (ids.length === 0) {
		return <StopCursorContainer startCursor={props.startCursor} stopCursor={null} />;
	}

	const events = await getEventsForIds(ids);
	const ordered = getOrderedEvents(events, "latest");

	const stopCursor = ids.length < 100 ? null : ordered[ordered.length - 1];
	const parsedStopCursor = stopCursor === null ? null : serializeCursor(stopCursor);

	return (
		<StopCursorContainer startCursor={props.startCursor} stopCursor={parsedStopCursor}>
			<VirtualisationContainer>
				{ordered.map((event, i) => {
					const previous = ordered[i - 1];
					const previousEvent = previous === undefined ? deserializeCursor(props.startCursor) : previous;

					return (
						<ErrorBoundary key={i} fallback={null}>
							<EventTableRow
								txIndex={event.tx_index}
								blockNumber={event.block_number}
								blockTimestamp={event.block_timestamp.getTime()}
								previousBlockTimestamp={previousEvent.block_timestamp.getTime()}
							>
								<div className="px-3 py-1.5 overflow-hidden grow">
									<EventDescription event={event} address={props.address} />
								</div>

								<div className="px-3 py-1.5 overflow-hidden shrink-0">
									<EventTimestamp timestamp={event.block_timestamp} />
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
