import clsx from "clsx";
import { ErrorBoundary } from "react-error-boundary";

import { Account } from "@/components/account";
import { execute } from "@/aggregates/aggregate";
import { EtherscanIcon } from "@/components/icons";
import { Timestamp } from "@/components/timestamp";
import { getOrderedEvents, parseId } from "@/helpers";
import { IconButton } from "@/components/icon-button";
import { balances_v1 } from "@/aggregates/balances_v1";
import { getEventsForIds, type Event } from "@/db/events";
import { Erc20, getTokenPrice } from "@/components/erc-20";
import { getBlockByNumber, type Block } from "@/state/block";
import { ETH_ADDRESS, TRANSACTION_EVENT, ZERO_ADDRESS } from "@/constants";
import { getTxByPosition, getTxReceiptByHash } from "@/state/tx";
import { EventDescription } from "@/components/event-description";
import { RelativeTimestamp } from "@/components/relative-timestamp";
import { AddFrameButton, CloseFrameButton } from "@/frames/frame-context-provider";
import { getEventIdsForTxPosition } from "@/indexes/index_block_number_tx_index_v4";
import { defined, formatNumber, hexToNumber, isHexEqual, numberToHex } from "@/utils";
import { Erc721 } from "@/components/erc-721";

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
					<div className="flex items-center overflow-hidden">
						<p className="text-gray-900 font-semibold text-base select-all min-w-24">Transaction</p>
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

			<div className="relative isolate overflow-scroll">
				<div className="px-3 pb-3">
					<div className="flex flex-col items-start gap-1">
						<div className="flex items-start justify-between">
							<span className="min-w-24 text-sm text-gray-500">Status</span>

							<span className={clsx("text-sm capitalize", receipt.status === "0x1" ? "text-green-500" : "text-red-500")}>
								{receipt.status === "0x1" ? "Success" : "Failed"}
							</span>
						</div>

						<div className="flex items-start justify-between">
							<span className="min-w-24 text-sm text-gray-500">Timestamp</span>

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
							<span className="min-w-24 text-sm text-gray-500">Block #</span>

							<AddFrameButton
								frame={String(hexToNumber(tx.blockNumber))}
								className="text-sm text-gray-900 cursor-pointer -mx-px px-px rounded hover:bg-gray-100 data-[hovered=true]:bg-gray-100 select-none"
							>
								{formatNumber(hexToNumber(tx.blockNumber))}
							</AddFrameButton>
						</div>

						<div className="flex items-start justify-between">
							<span className="min-w-24 text-sm text-gray-500">Tx Fee</span>

							<div className="text-sm text-gray-900 flex items-center gap-1">
								<span>{formattedFeeEth} ETH</span>
								{formattedFeeUsd === null ? null : <span className="text-gray-500">({formattedFeeUsd})</span>}
							</div>
						</div>

						<div className="flex items-start justify-between">
							<span className="min-w-24 text-sm text-gray-500">By</span>

							<span className="text-sm text-gray-900">
								<Account chain={1} address={tx.from} />
							</span>
						</div>

						<div className="flex items-start justify-between">
							<span className="min-w-24 text-sm text-gray-500">Intent</span>

							{defined(intent) && (
								<ErrorBoundary fallback={null}>
									<EventDescription event={intent} address={tx.from} />
								</ErrorBoundary>
							)}
						</div>
					</div>
				</div>

				<Balances block={block} events={ordered} />

				<Logs events={ordered} />
			</div>
		</div>
	);
}

function Logs(props: { events: Event[] }) {
	if (props.events.length === 0) {
		return (
			<div className="p-3 flex items-center justify-center">
				<p className="text-gray-900 text-sm">No events found</p>
			</div>
		);
	}

	const logs = props.events.filter((event) => {
		return !isHexEqual(numberToHex(parseId(event.id).logIndex), TRANSACTION_EVENT);
	});

	return (
		<div>
			<div className="flex items-center justify-between px-3 h-8 bg-gray-100 sticky top-0 z-10">
				<p className="text-sm text-gray-500 font-normal text-nowrap select-all">Logs</p>
			</div>

			<div className="p-3 flex flex-col gap-1">
				{logs.map((event) => {
					const { logIndex } = parseId(event.id);

					return (
						<ErrorBoundary key={event.id} fallback={null}>
							<div className="flex">
								<span className="text-sm text-gray-500 min-w-24">({formatNumber(logIndex)})</span>

								<EventDescription event={event} address={undefined} />
							</div>
						</ErrorBoundary>
					);
				})}
			</div>
		</div>
	);
}

function Balances(props: { block: Block; events: Event[] }) {
	// Compute sum of transfers

	const transfers = props.events.filter((event) => event.tag === "log_erc20_transfer_v1" || event.tag === "log_erc721_transfer_v1");
	const result = execute(balances_v1, transfers);

	// Remove values where the net-change is zero, and also remove the null address

	const filtered = Object.entries(result).filter(([key, quantity]) => {
		if (quantity === 0n) {
			return false;
		}

		if (key.startsWith(ZERO_ADDRESS)) {
			return false;
		}

		return true;
	});

	if (filtered.length === 0) {
		return;
	}

	// Group by address

	const nested = filtered.reduce(
		(result, [key, value]) => {
			const [address, ...rest] = key.split(":");

			result[address] ??= {};
			result[address][rest.join(":")] = value;

			return result;
		},
		{} as Record<string, Record<string, bigint>>,
	);

	// Within each address, sort by asset and then whether the quantity is positive or negative

	const rank = (asset: string) => {
		if (asset.startsWith("erc20")) {
			return 0;
		}

		if (asset.startsWith("erc721")) {
			return 1;
		}

		return 2;
	};

	const timestamp = hexToNumber(props.block.timestamp) * 1000;

	return (
		<div>
			<div className="flex items-center justify-between px-3 h-8 bg-gray-100 sticky top-0 z-10">
				<p className="text-sm text-gray-500 font-normal text-nowrap select-all">Transfers</p>
			</div>

			<div className="">
				{Object.entries(nested).map(([address, assets]) => {
					const sorted = Object.entries(assets).sort(([assetA], [assetB]) => {
						return rank(assetA) - rank(assetB);
					});

					return (
						<div key={address} className="p-3 flex not-last:border-b">
							<div className="flex-1">
								<span className="text-sm text-gray-900">
									<Account chain={1} address={address as `0x${string}`} />
								</span>
							</div>

							<div className="flex-1">
								{sorted.map(([asset, quantity]) => {
									if (asset.startsWith("erc20")) {
										const [_, address] = asset.split(":") as [string, `0x${string}`];

										return (
											<span key={asset} className="flex items-center gap-1 text-sm text-gray-900">
												<Erc20 chain={1} address={address} quantity={quantity} at={timestamp} />
											</span>
										);
									}

									if (asset.startsWith("erc721")) {
										const [_, address, id] = asset.split(":") as [string, `0x${string}`, `0x${string}`];

										return (
											<span key={asset} className="flex items-center gap-1 text-sm text-gray-900">
												<Erc721 chain={1} address={address} id={id} />
											</span>
										);
									}
								})}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
