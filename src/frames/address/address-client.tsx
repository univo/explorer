"use client";

import clsx from "clsx";
import { getAddress } from "viem";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Suspense, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { createFromFetch } from "@tanstack/react-start/rsc";

import { iife } from "@/utils";
import { parseId } from "@/helpers";
import { Spinner } from "@/components/spinner";
import { IconButton } from "@/components/icon-button";
import { CopyButton } from "@/components/copy-button";
import { sf_getLatestEventForAccount } from "@/functions";
import { ArrowUpIcon, EtherscanIcon } from "@/components/icons";
import { CloseFrameButton } from "@/frames/frame-context-provider";
import { AddressEventFiltersSkeleton } from "./address-event-filters";
import { PresetContextProvider, usePresetContext } from "./preset-context";
import { CursorContextProvider, useCursorContext } from "./cursor-context";

export function AddressClient(props: { address: `0x${string}` }) {
	return (
		<div className="h-full flex flex-col bg-white">
			<PresetContextProvider>
				<CursorContextProvider>
					<Header address={props.address} />
					<Events address={props.address} />
				</CursorContextProvider>
			</PresetContextProvider>
		</div>
	);
}

function Header(props: { address: `0x${string}` }) {
	const query = useQuery({
		queryKey: [`/rsc/address-header?address=${props.address}`],
		queryFn: ({ queryKey }) => createFromFetch(fetch(queryKey.join())),
	});

	if (query.status === "success") {
		return <Suspense fallback={<HeaderSkeleton address={props.address} />}>{query.data}</Suspense>;
	}

	return <HeaderSkeleton address={props.address} />;
}

function HeaderSkeleton(props: { address: `0x${string}` }) {
	return (
		<div className="bg-white py-3 border-b border-gray-200 space-y-3">
			<div className="px-3 flex items-center justify-between">
				<div />

				<div className="flex items-center gap-2">
					<CopyButton value={props.address} />

					<IconButton href={`https://etherscan.io/address/${props.address}`}>
						<EtherscanIcon className="shrink-0 size-4" />
					</IconButton>

					<CloseFrameButton />
				</div>
			</div>

			<AddressEventFiltersSkeleton />
		</div>
	);
}

function Events(props: { address: `0x${string}` }) {
	const cursor = useCursorContext();

	const nextCursor = getNextCursor(cursor.cursors);

	return (
		<div className="relative grow overflow-y-scroll overscroll-y-none isolate">
			<div className="sticky top-0 h-0 z-20">
				<Banner address={props.address} />
			</div>

			<div>
				{Array.from(cursor.cursors).map(([startCursor]) => {
					return (
						<EventsContainer
							key={startCursor} //
							address={props.address}
							startCursor={startCursor}
						/>
					);
				})}

				{nextCursor === null ? <NoMoreEvents /> : <LoadingIndicator onVisible={() => cursor.insertNextCursor(nextCursor)} />}
			</div>
		</div>
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

function Banner(props: { address: `0x${string}` }) {
	const cursor = useCursorContext();
	const preset = usePresetContext();

	const address = getAddress(props.address);

	const timestamp = iife(() => {
		const firstBatch = Array.from(cursor.cursors)[0];

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
		queryKey: ["latest-event", address, preset.value],
		queryFn: () => getLatestEventForAccount({ data: { address, preset: preset.value } }),
	});

	const show = query.status === "success" && typeof query.data === "string" && parseId(query.data).blockTimestamp > timestamp;

	return (
		<div className="flex justify-center pt-4 pointer-events-none">
			<button
				type="button"
				onMouseDown={() => cursor.refreshCursors()}
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
	const preset = usePresetContext();

	const query = useQuery({
		queryFn: ({ queryKey }) => createFromFetch(fetch(queryKey.join())),
		queryKey: [`/rsc/address-events?address=${props.address}&preset=${preset.value}&cursor=${props.startCursor}`],
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

// TODO
// This virtualisation strategy breaks our position sticky separators. This creates a child-div
// that only allows the header to be sticky while this child div is visible. It also means that
// between sections there isn't a border when there should be one. Instead of rendering nothing,
// we should render the active position sticky separator only

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
