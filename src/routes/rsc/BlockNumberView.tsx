import * as v from "valibot";
import { ErrorBoundary } from "react-error-boundary";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { BlockNumberSchema } from "@/schema";
import { getEventsForIds } from "@/db/events";
import { EtherscanIcon } from "@/components/icons";
import { getBlock, type Block } from "@/state/block";
import { CloseViewButton } from "@/components/views";
import { IconButton } from "@/components/icon-button";
import { getOrderedEvents, parseId } from "@/helpers";
import { EventTableRow } from "@/components/event-table-row";
import { EventDescription } from "@/components/event-description";
import { formatDay, formatNumber, formatRelativeDate, raise } from "@/utils";
import { getEventIdsForBlockNumber } from "@/indexes/block-number-tx-index-v4";

async function BlockNumberView(props: { number: number }) {
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
		<div className="border-b border-gray-200 bg-white px-3 py-3 flex items-center justify-between">
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
	const first = ordered[0] || raise("Expected at least one event");
	const date = new Date(parseId(first.id).blockTimestamp * 1000);

	return (
		<div className="relative grow overflow-scroll isolate">
			<div className="flex items-center justify-between px-3 h-8 bg-gray-100 sticky top-0 z-10">
				<p className="text-sm text-gray-500 font-normal text-nowrap select-all">{formatDay(date)}</p>

				{Date.now() - date.getTime() > 24 * 60 * 60 * 1000 && (
					<p className="text-sm text-gray-500 font-normal text-nowrap select-all text-right">
						{formatRelativeDate(date)}
					</p>
				)}
			</div>

			{ordered.map((event) => {
				return (
					<ErrorBoundary key={event.id} fallback={null}>
						<div className="border-b border-gray-200">
							<EventTableRow id={event.id}>
								<div className="px-3 py-1.5 overflow-hidden grow">
									<EventDescription event={event} />
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

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(v.object({ number: BlockNumberSchema }))
	.handler(({ data }) => renderToReadableStream(<BlockNumberView number={data.number} />));

export const Route = createFileRoute("/rsc/BlockNumberView")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const search = new URL(request.url).searchParams;

				const number = search.get("number");
				if (number === null) throw new Error("Expected number");

				const stream = await getFlightStream({ data: { number } });

				return new Response(stream, {
					headers: {
						"Content-Type": "text/x-component",
					},
				});
			},
		},
	},
});
