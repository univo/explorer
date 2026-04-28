import { Fragment, Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFromFetch } from "@tanstack/react-start/rsc";

import { EtherscanIcon } from "@/components/icons";
import { IconButton } from "@/components/icon-button";
import { getEventsForIds, type Event } from "@/db/events";
import { getAccount, type Account } from "@/state/account";
import { EventTableRow } from "@/components/event-table-row";
import { getEventIdsForAccount } from "@/indexes/account-v1";
import { formatRelativeDate, formatTime, raise } from "@/utils";
import { CloseViewButton } from "@/components/close-view-button";
import { getOrderedEvents, groupEventsByDay, parseId } from "@/helpers";
import { Erc20ApprovalV1AccountDescription } from "@/events/erc20-approval-v1/component";
import { Erc20TransferV1AccountDescription } from "@/events/erc20-transfer-v1/component";
import { Table, TableBody, TableData, TableHead, TableHeading } from "@/components/table";
import { NativeTransferV1AccountDescription } from "@/events/native-transfer-v1/component";
import { Erc721TransferV1AccountDescription } from "@/events/erc721-transfer-v1/component";
import { Erc721ApprovalV1AccountDescription } from "@/events/erc721-approval-v1/component";
import { CancelPendingTxV1AccountDescription } from "@/events/cancel-pending-tx-v1/component";
import { InputDataMessageV1AccountDescription } from "@/events/input-data-message-v1/component";
import { EnsNameRegisteredV1AccountDescription } from "@/events/ens-name-registered-v1/component";
import { ContractDeploymentV1AccountDescription } from "@/events/contract-deployment-v1/component";

export function AddressViewSuspense(props: { address: `0x${string}` }) {
	return (
		<Suspense fallback={<EmptyState address={props.address} />}>
			<CachedAddressView address={props.address}></CachedAddressView>
		</Suspense>
	);
}

function EmptyState(props: { address: `0x${string}` }) {
	return (
		<div className="h-full flex flex-col bg-white">
			<div className="bg-white px-3 py-3 flex items-center justify-between">
				<div className="flex items-center gap-2 overflow-hidden"></div>

				<div className="flex items-center gap-2">
					<IconButton href={`https://etherscan.io/address/${props.address}`}>
						<EtherscanIcon className="shrink-0 size-4" />
					</IconButton>

					<CloseViewButton view={props.address} />
				</div>
			</div>
		</div>
	);
}

function CachedAddressView(props: { address: `0x${string}` }) {
	const query = useSuspenseQuery({
		queryKey: ["address", props.address],
		queryFn: () => createFromFetch(fetch(`/api/address/${props.address}`)),
	});

	return query.data;
}

export async function AddressView(props: { address: `0x${string}` }) {
	// Load events by index
	const [account, ids] = await Promise.all([
		getAccount({ chain: 1, address: props.address }),
		getEventIdsForAccount(props.address, { order: "latest", limit: 100 }),
	]);

	return (
		<div className="h-full flex flex-col bg-white">
			<Header account={account} />
			<EventsTable account={account} ids={ids} />
		</div>
	);
}

function Header(props: { account: Account }) {
	return (
		<div className="bg-white px-3 py-3 flex items-center justify-between">
			<div className="flex items-center gap-2 overflow-hidden">
				{props.account.name_tag === null ? (
					<Fragment>
						<p className="text-gray-900 font-semibold text-base select-all">Account</p>
						<p className="text-gray-500 text-base select-all truncate">{props.account.address}</p>
					</Fragment>
				) : (
					<p className="text-gray-900 font-semibold text-base select-all truncate">{props.account.name_tag}</p>
				)}
			</div>

			<div className="flex items-center gap-2">
				<IconButton href={`https://etherscan.io/address/${props.account.address}`}>
					<EtherscanIcon className="shrink-0 size-4" />
				</IconButton>

				<CloseViewButton view={props.account.address} />
			</div>
		</div>
	);
}

async function EventsTable(props: { account: Account; ids: string[] }) {
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
	const grouped = groupEventsByDay(ordered);

	return (
		<div className="relative grow overflow-scroll isolate">
			{Object.entries(grouped).map(([date, events]) => {
				if (events === undefined) throw new Error();

				const event = events[0] || raise("Expected at least one event");
				const { block_timestamp } = parseId(event.id);

				return (
					<Table key={date}>
						<TableHead className="sticky top-0 z-10">
							<TableHeading>
								<div className="flex items-center justify-between">
									<p className="text-sm text-gray-500 font-normal text-nowrap select-all">{date}</p>
								</div>
							</TableHeading>

							<TableHeading>
								<HeaderTimestamp timestamp={new Date(block_timestamp * 1000)} />
							</TableHeading>
						</TableHead>

						<TableBody>
							{events.map((event) => {
								const { block_timestamp } = parseId(event.id);

								return (
									<EventTableRow key={event.id} id={event.id}>
										<TableData>
											<AccountEventDescription account={props.account} event={event} />
										</TableData>

										<TableData>
											<EventTimestamp timestamp={new Date(block_timestamp * 1000)} />
										</TableData>
									</EventTableRow>
								);
							})}
						</TableBody>
					</Table>
				);
			})}
		</div>
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

	return (
		<p className="text-sm text-gray-500 text-right text-nowrap select-all">{formatRelativeDate(props.timestamp)}</p>
	);
}
