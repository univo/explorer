import clsx from "clsx";
import { ErrorBoundary } from "react-error-boundary";

import { Account } from "@/components/account";
import { getBlockByNumber } from "@/state/block";
import { EtherscanIcon } from "@/components/icons";
import { Timestamp } from "@/components/timestamp";
import { getTokenPrice } from "@/components/erc-20";
import { getOrderedEvents, parseId } from "@/helpers";
import { IconButton } from "@/components/icon-button";
import { getEventsForIds, type Event } from "@/db/events";
import { ETH_ADDRESS, TRANSACTION_EVENT } from "@/constants";
import { getTxByPosition, getTxReceiptByHash } from "@/state/tx";
import { EventDescription } from "@/components/event-description";
import { RelativeTimestamp } from "@/components/relative-timestamp";
import { AddFrameButton, CloseFrameButton } from "@/components/frames";
import { getEventIdsForTxPosition } from "@/indexes/block-number-tx-index-v4";
import { defined, formatNumber, hexToNumber, isHexEqual, numberToHex } from "@/utils";

export async function TxPositionRsc(props: { block: number; tx: number }) {
	const [block, tx, ids] = await Promise.all([
		getBlockByNumber(props.block),
		getTxByPosition({ block: props.block, tx: props.tx }), //
		getEventIdsForTxPosition(1, props.block, props.tx),
	]);

	const timestamp = new Date(hexToNumber(block.timestamp) * 1000);

	const [events, receipt, price] = await Promise.all([
		getEventsForIds(ids),
		getTxReceiptByHash(tx.hash), //
		getTokenPrice({ chain: 1, token: ETH_ADDRESS, timestamp }),
	]);

	const feeWei = BigInt(receipt.effectiveGasPrice) * BigInt(receipt.gasUsed);
	const feeEth = Number(feeWei) / 10 ** 18;
	const formattedFeeEth = formatNumber(feeEth, feeEth < 1 ? { maximumSignificantDigits: 2 } : { maximumFractionDigits: 2 });

	const feeUsd = price === null ? null : Number(price.price_usd) * feeEth;
	const options = { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol" } as const;
	const formattedFeeUsd = feeUsd === null ? null : formatNumber(feeUsd, options);

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

						<CloseFrameButton />
					</div>
				</div>
			</div>

			<div className="relative overflow-scroll">
				<div className="px-3 pb-3">
					<div className="flex flex-col items-start gap-1">
						<div className="flex items-start justify-between">
							<span className="min-w-24 text-sm text-gray-700">Status</span>

							<span className={clsx("text-sm capitalize", receipt.status === "0x1" ? "text-green-500" : "text-red-500")}>
								{receipt.status === "0x1" ? "Success" : "Failed"}
							</span>
						</div>

						<div className="flex items-start justify-between">
							<span className="min-w-24 text-sm text-gray-700">Timestamp</span>

							<div className="flex items-center gap-1 text-sm text-gray-900">
								<span className="flex-none">
									<Timestamp date time utc={timestamp} />
								</span>

								<span className="flex-initial truncate text-gray-500">
									(<RelativeTimestamp utc={timestamp} />)
								</span>
							</div>
						</div>

						<div className="flex items-start justify-between">
							<span className="min-w-24 text-sm text-gray-700">Block #</span>

							<AddFrameButton
								frame={String(hexToNumber(tx.blockNumber))}
								className="text-sm text-gray-900 cursor-pointer -mx-px px-px rounded hover:bg-gray-200 data-[hovered=true]:bg-gray-200 select-none"
							>
								{formatNumber(hexToNumber(tx.blockNumber))}
							</AddFrameButton>
						</div>

						<div className="flex items-start justify-between">
							<span className="min-w-24 text-sm text-gray-700">Tx Fee</span>

							<div className="text-sm text-gray-900 flex items-center gap-1">
								<span>{formattedFeeEth} ETH</span>
								{formattedFeeUsd === null ? null : <span className="text-gray-500">({formattedFeeUsd})</span>}
							</div>
						</div>

						<div className="flex items-start justify-between">
							<span className="min-w-24 text-sm text-gray-700">By</span>

							<span className="text-sm text-gray-900">
								<Account chain={1} address={tx.from} />
							</span>
						</div>

						<div className="flex items-start justify-between">
							<span className="min-w-24 text-sm text-gray-700">Intent</span>

							{defined(intent) && (
								<ErrorBoundary fallback={null}>
									<EventDescription event={intent} address={tx.from} />
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

							<EventDescription event={event} address={undefined} />
						</div>
					</ErrorBoundary>
				);
			})}
		</div>
	);
}
