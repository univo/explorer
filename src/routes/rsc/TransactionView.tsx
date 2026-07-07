import clsx from "clsx";
import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { getTx, type Tx } from "@/state/tx";
import { TransactionSchema } from "@/schema";
import { getEventsForIds } from "@/db/events";
import { EtherscanIcon } from "@/components/icons";
import { EventDescription } from "./BlockNumberView";
import { IconButton } from "@/components/icon-button";
import { getOrderedEvents, parseId } from "@/helpers";
import { getEventIdsForTxHash } from "@/indexes/tx-hash-v1";
import { formatDateTime, formatNumber, raise } from "@/utils";
import { AddViewButton, CloseViewButton } from "@/components/views";
import { RelativeTimestamp } from "@/components/relative-timestamp";

async function TransactionView(props: { tx: string }) {
	const [tx, ids] = await Promise.all([
		getTx(props.tx as "0x"), //
		getEventIdsForTxHash(props.tx as "0x"),
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
		<div className="bg-white p-3 flex items-center justify-between gap-3">
			<div className="flex items-center gap-2 overflow-hidden">
				<p className="text-gray-900 font-semibold text-base select-all">Transaction</p>
				<p className="text-gray-500 text-base select-all truncate">{props.tx.hash}</p>
			</div>

			<div className="flex items-center gap-2">
				<IconButton href={`https://etherscan.io/tx/${props.tx.hash}`}>
					<EtherscanIcon className="shrink-0 size-4" />
				</IconButton>

				<CloseViewButton view={props.tx.hash} />
			</div>
		</div>
	);
}

async function Events(props: { ids: string[] }) {
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
	const ordered = getOrderedEvents(events, "reverse");

	const event = events[0] || raise("Expected at least one event");
	const { blockNumber, txIndex, blockTimestamp } = parseId(event.id);
	const timestamp = new Date(blockTimestamp * 1000);

	return (
		<div className="overflow-scroll flex flex-col gap-3">
			<div className="px-3 flex items-center gap-12 text-sm text-gray-700">
				<div className="flex flex-col items-start gap-1">
					<p>Status</p>
					<p>Timestamp</p>
					<p>Block #</p>
					<p>Tx Index</p>
				</div>

				<div className="flex flex-col items-start gap-1">
					<div className="flex items-center gap-2">
						<p className={clsx("capitalize", event.success ? "text-green-500" : "text-red-500")}>
							{event.success ? "Success" : "Failed"}
						</p>
					</div>

					<div className="flex items-center space-x-1">
						<p className="flex-none">{formatDateTime(timestamp)}</p>

						<p className="flex-initial truncate">
							(<RelativeTimestamp timestamp={timestamp} />)
						</p>
					</div>

					<AddViewButton
						view={String(blockNumber)}
						className="cursor-pointer -mx-px px-px rounded hover:bg-gray-200 data-[hovered=true]:bg-gray-200 select-none"
					>
						{formatNumber(blockNumber)}
					</AddViewButton>

					<p>{formatNumber(txIndex)}</p>
				</div>
			</div>

			<div className="border-t"></div>

			<div className="px-3 pb-3 rounded-md flex flex-col gap-1">
				{ordered.map((event) => {
					const { logIndex } = parseId(event.id);

					return (
						<div key={event.id} className="flex">
							<span className="text-sm text-gray-700 min-w-10">({formatNumber(logIndex)})</span>
							<EventDescription event={event} />
						</div>
					);
				})}
			</div>
		</div>
	);
}

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(v.object({ tx: TransactionSchema }))
	.handler(({ data }) => renderToReadableStream(<TransactionView tx={data.tx} />));

export const Route = createFileRoute("/rsc/TransactionView")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const search = new URL(request.url).searchParams;

				const tx = search.get("tx");
				if (tx === null) throw new Error("Expected tx");

				const stream = await getFlightStream({ data: { tx } });

				return new Response(stream, {
					headers: {
						"Content-Type": "text/x-component",
					},
				});
			},
		},
	},
});
