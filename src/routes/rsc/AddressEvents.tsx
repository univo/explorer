import * as v from "valibot";
import { Fragment } from "react";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import type { Account } from "@/state/account";
import { AddressSchema } from "@/components/views";
import { getOrderedEvents, parseId } from "@/helpers";
import { formatRelativeDate, formatTime } from "@/utils";
import { getEventsForIds, type Event } from "@/db/events";
import { StopCursorContainer } from "@/views/address-view";
import { EventTableRow } from "@/components/event-table-row";
import { getEventIdsForAccount } from "@/indexes/account-v1";
import { RelativeTimestamp } from "@/components/relative-timestamp";
import { Erc20ApprovalV1AccountDescription } from "@/events/erc20-approval-v1/component";
import { Erc20TransferV1AccountDescription } from "@/events/erc20-transfer-v1/component";
import { NativeTransferV1AccountDescription } from "@/events/native-transfer-v1/component";
import { Erc721TransferV1AccountDescription } from "@/events/erc721-transfer-v1/component";
import { Erc721ApprovalV1AccountDescription } from "@/events/erc721-approval-v1/component";
import { CancelPendingTxV1AccountDescription } from "@/events/cancel-pending-tx-v1/component";
import { InputDataMessageV1AccountDescription } from "@/events/input-data-message-v1/component";
import { EnsNameRegisteredV1AccountDescription } from "@/events/ens-name-registered-v1/component";
import { ContractDeploymentV1AccountDescription } from "@/events/contract-deployment-v1/component";

async function AddressEvents(props: { address: `0x${string}`; startCursor: string }) {
	const ids = await getEventIdsForAccount(props.address, {
		limit: 100,
		order: "latest",
		cursor: props.startCursor,
	});

	// This is pretty rare ands means the last batch fetched exactly the last 100 events

	if (ids.length === 0) {
		return <StopCursorContainer startCursor={props.startCursor} stopCursor={null} />;
	}

	const events = await getEventsForIds(ids);
	const ordered = getOrderedEvents(events, "latest");

	// TODO: Remove this and pass only the address
	const account = { chain: 1, address: props.address, name_tag: null, label: null };

	const stopCursor = ids.length < 100 ? null : ordered[ordered.length - 1].id;

	return (
		<StopCursorContainer startCursor={props.startCursor} stopCursor={stopCursor}>
			{ordered.map((event, i) => {
				const previous = ordered[i - 1];
				const previousId = previous === undefined ? props.startCursor : previous.id;

				return (
					<Fragment key={event.id}>
						<EventHeader eventId={event.id} previousId={previousId} />
						<EventRow event={event} account={account} />
					</Fragment>
				);
			})}
		</StopCursorContainer>
	);
}

function EventHeader(props: { eventId: string; previousId: string }) {
	const event = new Date(parseId(props.eventId).block_timestamp * 1000);

	const eventString = event.toLocaleDateString("en", {
		month: "short",
		day: "numeric",
		year: "numeric",
		timeZone: "UTC",
	});

	const previous = new Date(parseId(props.previousId).block_timestamp * 1000);

	const previousString = previous.toLocaleDateString("en", {
		month: "short",
		day: "numeric",
		year: "numeric",
		timeZone: "UTC",
	});

	// If the previous event falls on a different day we add the header
	if (eventString === previousString) {
		return undefined;
	}

	return (
		<div className="flex items-center justify-between px-3 h-8 bg-gray-100 sticky top-0 z-10">
			<p className="text-sm text-gray-500 font-normal text-nowrap select-all">{eventString}</p>
			<HeaderTimestamp timestamp={event} />
		</div>
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

function EventRow(props: { event: Event; account: Account }) {
	return (
		<EventTableRow id={props.event.id}>
			<div className="px-3 py-1.5 overflow-hidden grow">
				<AccountEventDescription account={props.account} event={props.event} />
			</div>

			<div className="px-3 py-1.5 overflow-hidden shrink-0">
				<EventTimestamp timestamp={new Date(parseId(props.event.id).block_timestamp * 1000)} />
			</div>
		</EventTableRow>
	);
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

function AccountEventDescription(props: { account: Account; event: Event }) {
	if (props.event.tag === "erc20_approval_v1") {
		return <Erc20ApprovalV1AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "native_transfer_v1") {
		return <NativeTransferV1AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "erc20_transfer_v1") {
		return <Erc20TransferV1AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "input_data_message_v1") {
		return <InputDataMessageV1AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "ens_name_registered_v1") {
		return <EnsNameRegisteredV1AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "contract_deployment_v1") {
		return <ContractDeploymentV1AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "cancel_pending_tx_v1") {
		return <CancelPendingTxV1AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "erc721_transfer_v1") {
		return <Erc721TransferV1AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "erc721_approval_v1") {
		return <Erc721ApprovalV1AccountDescription event={props.event} account={props.account} />;
	}
}

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(v.object({ address: AddressSchema, cursor: v.string() }))
	.handler(({ data }) => renderToReadableStream(<AddressEvents address={data.address} startCursor={data.cursor} />));

// TODO: Add CDN caching
// TODO: We can cache immutably based on the timestamp in the cursor

export const Route = createFileRoute("/rsc/AddressEvents")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const search = new URL(request.url).searchParams;

				const address = search.get("address");
				if (address === null) throw new Error("Expected request address");

				const cursor = search.get("cursor");
				if (cursor === null) throw new Error("Expected request cursor");

				const stream = await getFlightStream({ data: { address, cursor } });

				return new Response(stream, {
					headers: {
						"Content-Type": "text/x-component",
					},
				});
			},
		},
	},
});
