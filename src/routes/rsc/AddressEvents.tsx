import clsx from "clsx";
import * as v from "valibot";
import { Fragment } from "react";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { raise } from "@/utils";
import { AddressSchema } from "@/schema";
import type { Account } from "@/state/account";
import { getOrderedEvents, parseId } from "@/helpers";
import { getEventsForIds, type Event } from "@/db/events";
import { EventTableRow } from "@/components/event-table-row";
import { getEventIdsForAccount } from "@/indexes/account-v3";
import { RelativeTimestamp } from "@/components/relative-timestamp";
import { formatDay, formatRelativeDate, formatTime } from "@/utils";
import { StopCursorContainer, VirtualisationContainer } from "@/views/address-view";
import { UsdcBlacklistV3AccountDescription } from "@/events/usdc-blacklist-v3/component";
import { FwaNftDepositedV3AccountDescription } from "@/events/fwa-nft-deposited-v3/component";
import { FwaPositionSettledV3AccountDescription } from "@/events/fwa-position-settled-v3/component";
import { Erc20ApprovalV3AccountDescription } from "@/events/erc20-approval-v3/component";
import { Erc20TransferV3AccountDescription } from "@/events/erc20-transfer-v3/component";
import { NativeTransferV3AccountDescription } from "@/events/native-transfer-v3/component";
import { Erc721TransferV3AccountDescription } from "@/events/erc721-transfer-v3/component";
import { Erc721ApprovalV3AccountDescription } from "@/events/erc721-approval-v3/component";
import { CancelPendingTxV3AccountDescription } from "@/events/cancel-pending-tx-v3/component";
import { InputDataMessageV3AccountDescription } from "@/events/input-data-message-v3/component";
import { EnsNameRegisteredV3AccountDescription } from "@/events/ens-name-registered-v3/component";
import { ContractDeploymentV3AccountDescription } from "@/events/contract-deployment-v3/component";
import { TornadoCashWithdrawalV3AccountDescription } from "@/events/tornado-cash-withdrawal-v3/component";

async function AddressEvents(props: { address: `0x${string}`; startCursor: string }) {
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

	// TODO: Remove this and pass only the address
	const account = { chain: 1, address: props.address, name_tag: null, label: null };

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
							<Fragment key={event.id}>
								{showHeader && (
									<div className="flex items-center justify-between px-3 h-8 bg-gray-100 sticky top-0 z-10">
										<p className="text-sm text-gray-500 font-normal text-nowrap select-all">{eventString}</p>
										<HeaderTimestamp timestamp={eventDate} />
									</div>
								)}

								<div className={clsx(showHeader === false && "not-first:border-t not-first:border-gray-200")}>
									<EventTableRow id={event.id}>
										<div className="px-3 py-1.5 overflow-hidden grow">
											<AccountEventDescription account={account} event={event} />
										</div>

										<div className="px-3 py-1.5 overflow-hidden shrink-0">
											<EventTimestamp timestamp={new Date(parseId(event.id).blockTimestamp * 1000)} />
										</div>
									</EventTableRow>
								</div>
							</Fragment>
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

function AccountEventDescription(props: { account: Account; event: Event }) {
	if (props.event.tag === "erc20_approval_v3") {
		return <Erc20ApprovalV3AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "native_transfer_v3") {
		return <NativeTransferV3AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "erc20_transfer_v3") {
		return <Erc20TransferV3AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "input_data_message_v3") {
		return <InputDataMessageV3AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "ens_name_registered_v3") {
		return <EnsNameRegisteredV3AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "contract_deployment_v3") {
		return <ContractDeploymentV3AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "cancel_pending_tx_v3") {
		return <CancelPendingTxV3AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "erc721_transfer_v3") {
		return <Erc721TransferV3AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "erc721_approval_v3") {
		return <Erc721ApprovalV3AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "tornado_cash_withdrawal_v3") {
		return <TornadoCashWithdrawalV3AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "usdc_blacklist_v3") {
		return <UsdcBlacklistV3AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "fwa_nft_deposited_v3") {
		return <FwaNftDepositedV3AccountDescription event={props.event} account={props.account} />;
	}

	if (props.event.tag === "fwa_position_settled_v3") {
		return <FwaPositionSettledV3AccountDescription event={props.event} account={props.account} />;
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
