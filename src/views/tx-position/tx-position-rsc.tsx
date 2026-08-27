import clsx from "clsx";
import { ErrorBoundary } from "react-error-boundary";

import { Account } from "@/components/account";
import { TRANSACTION_EVENT } from "@/constants";
import { EtherscanIcon } from "@/components/icons";
import { getOrderedEvents, parseId } from "@/helpers";
import { IconButton } from "@/components/icon-button";
import { getEventsForIds, type Event } from "@/db/events";
import { getTxByPosition, getTxReceiptByHash } from "@/state/tx";
import { RelativeTimestamp } from "@/components/relative-timestamp";
import { AddViewButton, CloseViewButton } from "@/components/views";
import { EventDescriptionLog } from "@/components/event-description-log";
import { getEventIdsForTxPosition } from "@/indexes/block-number-tx-index-v4";
import { EventDescriptionIntent } from "@/components/event-description-intent";
import { defined, formatDateTime, formatNumber, hexToNumber, isHexEqual, numberToHex } from "@/utils";

export async function TxPositionRsc(props: { block: number; tx: number }) {
	const [tx, ids] = await Promise.all([
		getTxByPosition({ block: props.block, tx: props.tx }), //
		getEventIdsForTxPosition(1, props.block, props.tx),
	]);

	const timestamp = new Date(hexToNumber(tx.blockTimestamp) * 1000);

	const [events, receipt] = await Promise.all([
		getEventsForIds(ids),
		getTxReceiptByHash(tx.hash), //
	]);

	const fee = (BigInt(receipt.effectiveGasPrice) * BigInt(receipt.cumulativeGasUsed)) / 1000000000000000000n;

	const ordered = getOrderedEvents(events, "reverse");

	const intent = events.find((event) => {
		return isHexEqual(numberToHex(parseId(event.id).logIndex), TRANSACTION_EVENT);
	});

	return (
		<div className="h-full flex flex-col bg-white">
			<div>
				<div className="bg-white p-3 flex items-center justify-between gap-3">
					<div className="flex items-center gap-2 overflow-hidden">
						<p className="text-gray-900 font-semibold text-base select-all">Transaction</p>
						<p className="text-gray-500 text-base select-all truncate">{tx.hash}</p>
					</div>

					<div className="flex items-center gap-2">
						<IconButton href={`https://etherscan.io/tx/${tx.hash}`}>
							<EtherscanIcon className="shrink-0 size-4" />
						</IconButton>

						<CloseViewButton />
					</div>
				</div>
			</div>

			<div className="relative overflow-scroll">
				<div className="px-3 pb-3">
					<div className="flex flex-col items-start gap-1">
						<div className="flex items-start justify-between">
							<p className="min-w-24 text-sm text-gray-700">Status</p>

							<p className={clsx("text-sm capitalize", receipt.status === "0x1" ? "text-green-500" : "text-red-500")}>
								{receipt.status === "0x1" ? "Success" : "Failed"}
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
								view={String(hexToNumber(tx.blockNumber))}
								className="text-sm text-gray-900 cursor-pointer -mx-px px-px rounded hover:bg-gray-200 data-[hovered=true]:bg-gray-200 select-none"
							>
								{formatNumber(hexToNumber(tx.blockNumber))}
							</AddViewButton>
						</div>

						<div className="flex items-start justify-between">
							<p className="min-w-24 text-sm text-gray-700">Fee</p>

							<p className="text-sm text-gray-900">{fee}</p>
						</div>

						<div className="flex items-start justify-between">
							<p className="min-w-24 text-sm text-gray-700">By</p>

							<p className="text-sm text-gray-900">
								<Account chain={1} address={tx.from} />
							</p>
						</div>

						<div className="flex items-start justify-between">
							<p className="min-w-24 text-sm text-gray-700">Intent</p>

							{defined(intent) && (
								<ErrorBoundary fallback={null}>
									<EventDescriptionIntent event={intent} address={tx.from} />
								</ErrorBoundary>
							)}
						</div>
					</div>
				</div>

				<div className="sticky top-0 border-t"></div>

				<Events events={ordered} />
			</div>
		</div>
	);
}

function Events(props: { events: Event[] }) {
	if (props.events.length === 0) {
		return (
			<div className="p-3 flex items-center justify-center">
				<p className="text-gray-900 text-sm font-medium">No events found</p>
			</div>
		);
	}

	const logs = props.events.filter((event) => {
		return !isHexEqual(numberToHex(parseId(event.id).logIndex), TRANSACTION_EVENT);
	});

	return (
		<div className="p-3 flex flex-col gap-1">
			{logs.map((event) => {
				const { logIndex } = parseId(event.id);

				return (
					<ErrorBoundary key={event.id} fallback={null}>
						<div className="flex">
							<span className="text-sm text-gray-700 min-w-12">({formatNumber(logIndex)})</span>

							<EventDescriptionLog event={event} />
						</div>
					</ErrorBoundary>
				);
			})}
		</div>
	);
}
