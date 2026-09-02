"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { getAddress, numberToHex } from "viem";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useInView } from "react-intersection-observer";
import { createFromFetch } from "@tanstack/react-start/rsc";
import { createContext, Suspense, useContext, useEffect, useState } from "react";

import { iife, raise } from "@/utils";
import { createId, parseId } from "@/helpers";
import { Spinner } from "@/components/spinner";
import { IconButton } from "@/components/icon-button";
import { CopyButton } from "@/components/copy-button";
import { CloseFrameButton } from "@/components/frames";
import { sf_getLatestEventForAccount } from "@/functions";
import { ArrowUpIcon, EtherscanIcon } from "@/components/icons";

export function AddressClient(props: { address: `0x${string}` }) {
	return (
		<div className="h-full flex flex-col bg-white">
			<Header address={props.address} />
			<Events address={props.address} />
		</div>
	);
}

function Header(props: { address: `0x${string}` }) {
	const query = useQuery({
		queryKey: [`/rsc/address-header?address=${props.address}`],
		queryFn: () => createFromFetch(fetch(`/rsc/address-header?address=${props.address}`)),
	});

	if (query.status === "success") {
		return <Suspense fallback={<HeaderFallback address={props.address} />}>{query.data}</Suspense>;
	}

	return <HeaderFallback address={props.address} />;
}

function HeaderFallback(props: { address: `0x${string}` }) {
	return (
		<div className="bg-white px-3 py-3 flex items-center justify-end border-b border-gray-200">
			<div className="flex items-center gap-2">
				<CopyButton value={props.address} />

				<IconButton href={`https://etherscan.io/address/${props.address}`}>
					<EtherscanIcon className="shrink-0 size-4" />
				</IconButton>

				<CloseFrameButton />
			</div>
		</div>
	);
}

type CursorContextValue = {
	cursors: Map<string, string | null | undefined>;
	refreshCursors: () => void;
	insertNextCursor: (startCursor: string) => void;
	insertStopCursor: (startCursor: string, stopCursor: string | null) => void;
};

const CursorContext = createContext<CursorContextValue | null>(null);

const useCursorContext = () => useContext(CursorContext) ?? raise("Missing CursorContext provider");

function Events(props: { address: `0x${string}` }) {
	const [cursors, setCursors] = useState<Map<string, string | null | undefined>>(() => {
		// TODO: Add cache alignment to the initial cursor

		const initialCursor = createId({
			blockTimestamp: numberToHex(Math.floor(Date.now() / 1000)),
			tableId: 0, // Irrelevant
			chainId: "0x1", // Irrelevant but must specify a known chain id
			txIndex: "0x0", // Irrelevant
			logIndex: "0x0", // Irrelevant
			blockNumber: "0x0", // Irrelevant
		});

		return new Map().set(initialCursor, undefined);
	});

	function refreshCursors() {
		setCursors(() => {
			const initialCursor = createId({
				blockTimestamp: numberToHex(Math.floor(Date.now() / 1000)),
				tableId: 0, // Irrelevant
				chainId: "0x1", // Irrelevant but must specify a known chain id
				txIndex: "0x0", // Irrelevant
				logIndex: "0x0", // Irrelevant
				blockNumber: "0x0", // Irrelevant
			});

			return new Map().set(initialCursor, undefined);
		});
	}

	function insertNextCursor(startCursor: string) {
		setCursors((cursors) => {
			const result = new Map(cursors); // Must be a new map to force react to rerender
			result.set(startCursor, undefined);
			return result;
		});
	}

	function insertStopCursor(startCursor: string, stopCursor: string | null) {
		setCursors((cursors) => {
			const result = new Map(cursors); // Must be a new map to force react to rerender
			result.set(startCursor, stopCursor);
			return result;
		});
	}

	const nextCursor = getNextCursor(cursors);

	return (
		<CursorContext value={{ cursors, refreshCursors, insertNextCursor, insertStopCursor }}>
			<div className="relative grow overflow-scroll isolate">
				<div className="sticky top-0 h-0">
					<Banner address={props.address} />
				</div>

				<div>
					{Array.from(cursors).map(([startCursor]) => {
						return (
							<EventsContainer
								key={startCursor} //
								address={props.address}
								startCursor={startCursor}
							/>
						);
					})}

					{nextCursor === null ? <NoMoreEvents /> : <LoadingIndicator onVisible={() => insertNextCursor(nextCursor)} />}
				</div>
			</div>
		</CursorContext>
	);
}

function getNextCursor(cursors: Map<string, string | null | undefined>): string | null {
	let final_cursor: string | undefined;

	for (const [key, value] of cursors) {
		if (value === null) {
			return null;
		}

		if (value === undefined) {
			return key;
		}

		final_cursor = value;
	}

	if (final_cursor === undefined) {
		throw new Error("Expected atleast the initial cursor");
	}

	return final_cursor;
}

// The plan is that we load on demand. We click the banner, it turns into a loading indicator that fetches the start
// cursor for the previous 50 events. We then render that start cursor, scroll to it, and hide the banner

function Banner(props: { address: `0x${string}` }) {
	const context = useCursorContext();

	const address = getAddress(props.address);

	const timestamp = iife(() => {
		const firstBatch = Array.from(context.cursors)[0];

		if (firstBatch === undefined) {
			throw new Error("Expected atleast the initial cursor");
		}

		const key = firstBatch[0];

		if (key === undefined) {
			throw new Error("Expected atleast the initial cursor");
		}

		return parseId(key).blockTimestamp;
	});

	const getLatestEventForAccount = useServerFn(sf_getLatestEventForAccount);

	const query = useQuery({
		refetchOnMount: false,
		refetchOnReconnect: "always",
		refetchOnWindowFocus: "always",
		queryKey: ["latest-event", address],
		queryFn: () => getLatestEventForAccount({ data: { address } }),
	});

	const show = query.status === "success" && typeof query.data === "string" && parseId(query.data).blockTimestamp > timestamp;

	return (
		<div className="flex justify-center pt-4 pointer-events-none">
			<button
				type="button"
				onMouseDown={() => context.refreshCursors()}
				className={clsx(
					"transform-gpu",
					show === true && "translate-y-0 scale-100 ease-[cubic-bezier(0,0,0,1.1)] duration-250",
					show === false && "-translate-y-15 scale-75 ease-[cubic-bezier(0,0,0,0.9)] duration-200",
					"cursor-pointer pointer-events-auto w-29 h-7 flex items-center justify-center gap-1.5 rounded-full bg-primary-500 shadow-md",
				)}
			>
				<ArrowUpIcon className="text-white shrink-0 size-3.5" />
				<span className="text-white text-sm">New events</span>
			</button>
		</div>
	);
}

function EventsContainer(props: { address: `0x${string}`; startCursor: string }) {
	const query = useQuery({
		queryKey: [`/rsc/address-events?address=${props.address}&cursor=${props.startCursor}`],
		queryFn: () => createFromFetch(fetch(`/rsc/address-events?address=${props.address}&cursor=${props.startCursor}`)),
	});

	if (query.status === "error") {
		return undefined;
	}

	if (query.status === "pending") {
		return undefined;
	}

	return <Suspense>{query.data}</Suspense>;
}

// The component allows the server to provide cursor related information back to the client

export function StopCursorContainer(props: { startCursor: string; stopCursor: string | null; children?: ReactNode }) {
	const context = useCursorContext();

	useEffect(() => {
		if (getNextCursor(context.cursors) === props.startCursor) {
			context.insertStopCursor(props.startCursor, props.stopCursor);
		}
	});

	return props.children;
}

export function VirtualisationContainer(props: { children: ReactNode }) {
	const [height, setHeight] = useState<number | null>(null);

	const { ref } = useInView({
		// We could probably add margin here to prevent the flash as hidden blocks return. Also note that this
		// virtualisation happens according to the document as the root, which means it applies to horizontal
		// scrolling too when we have a large number of horizontal frames
		rootMargin: "0px 608px 0px 608px",

		// This is pretty safe because our app never sees a lot of browser resizing. On desktop the width of each
		// frame is static. On mobile the only way to resize is to adjust the orientation.
		onChange: (inView, entry) => setHeight(inView ? null : entry.boundingClientRect.height),
	});

	return (
		<div ref={ref} style={{ height: height === null ? undefined : height }}>
			{height === null ? props.children : undefined}
		</div>
	);
}

function NoMoreEvents() {
	return (
		<div className="flex items-center justify-center h-16 not-first:border-t not-first:border-gray-200">
			<p className="text-gray-500 text-sm">No more events</p>
		</div>
	);
}

function LoadingIndicator(props: { onVisible?: () => void }) {
	const { ref } = useInView({
		onChange(inView) {
			if (inView) {
				if (props.onVisible) {
					props.onVisible();
				}
			}
		},
	});

	return (
		<div ref={ref} className="flex justify-center items-center h-16 not-first:border-t not-first:border-gray-200">
			<Spinner className="size-4" />
		</div>
	);
}
