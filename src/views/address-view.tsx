"use client";

import { numberToHex } from "viem";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, Suspense, useContext, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { createFromFetch } from "@tanstack/react-start/rsc";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { createId } from "@/helpers";
import { Spinner } from "@/components/spinner";
import { EtherscanIcon } from "@/components/icons";
import { IconButton } from "@/components/icon-button";
import { CloseViewButton } from "@/components/close-view-button";

type CursorContextValue = {
	value: string | null;
	update: Dispatch<SetStateAction<string | null>>;
};

const CursorContext = createContext<CursorContextValue | null>(null);

function createInitialCursor() {
	// TODO: Add cache alignment here? Probably to the nearest minute
	return createId({
		block_timestamp: numberToHex(Math.floor(Date.now() / 1000)),

		// All other fields are irrelevant
		table_id: 0,
		chain_id: "0x1",
		tx_index: "0x0",
		log_index: "0x0",
		block_number: "0x0",
	});
}

function useCursor() {
	const context = useContext(CursorContext);

	if (context === null) {
		throw new Error("CursorContext missing for AddressView");
	}

	return context;
}

function getNextCursor(previous: string | null, nextCursor: string | null) {
	if (previous === null) {
		return null; // We already know the earliest event
	}

	if (nextCursor === null) {
		return null; // We have found the earliest event
	}

	if (nextCursor < previous) {
		return nextCursor; // We have found an earlier event
	}

	return previous; // Ignore
}

function CursorProvider(props: { children?: ReactNode }) {
	const [value, update] = useState<string | null>(() => createInitialCursor());

	return <CursorContext.Provider value={{ value, update }}>{props.children}</CursorContext.Provider>;
}

export function AddressView(props: { address: `0x${string}` }) {
	return (
		<CursorProvider>
			<div className="h-full flex flex-col bg-white">
				<Header address={props.address} />
				<Events address={props.address} />
			</div>
		</CursorProvider>
	);
}

function Header(props: { address: `0x${string}` }) {
	const query = useQuery({
		queryKey: ["AddressHeader", props.address],
		queryFn: () => createFromFetch(fetch(`/rsc/AddressHeader?address=${props.address}`)),
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
				<IconButton href={`https://etherscan.io/address/${props.address}`}>
					<EtherscanIcon className="shrink-0 size-4" />
				</IconButton>

				<CloseViewButton view={props.address} />
			</div>
		</div>
	);
}

function Events(props: { address: `0x${string}` }) {
	const cursor = useCursor();

	const query = useInfiniteQuery({
		initialPageParam: cursor.value,
		getNextPageParam: () => cursor.value,
		queryKey: ["AddressEvents", props.address],
		queryFn: (ctx) => createFromFetch(fetch(`/rsc/AddressEvents?address=${props.address}&cursor=${ctx.pageParam}`)),
	});

	function fetchNextPage() {
		if (query.hasNextPage && !query.isFetching) {
			query.fetchNextPage();
		}
	}

	if (query.status === "pending") {
		return (
			<div className="relative grow overflow-scroll isolate">
				<LoadingIndicator onVisible={() => fetchNextPage()} />
			</div>
		);
	}

	if (query.status === "error") {
		return undefined;
	}

	return (
		<div className="relative grow overflow-scroll isolate">
			{query.data.pages.map((page, index) => {
				return <Suspense key={index}>{page}</Suspense>;
			})}

			{query.hasNextPage && <LoadingIndicator onVisible={() => fetchNextPage()} />}
		</div>
	);
}

export function EventsContainer(props: { cursor: string | null; children?: ReactNode }) {
	const cursor = useCursor();

	useEffect(() => {
		cursor.update((previous) => getNextCursor(previous, props.cursor));
	});

	const [height, setHeight] = useState(0);

	const { ref } = useInView({
		// This is our naive method for ensuring we render hidden blocks before they scroll back into view
		rootMargin: "1000px 0px 1000px 0px",

		// This is pretty safe because our app never sees a lot of browser resizing. On desktop the width of each
		// view is static. On mobile the only way to resize is to adjust the orientation.
		onChange: (inView, entry) => setHeight(inView ? 0 : entry.boundingClientRect.height),
	});

	if (props.cursor === null) {
		return (
			<div className="flex items-center justify-center h-16">
				<p className="text-gray-500 text-sm">No more events</p>
			</div>
		);
	}

	return (
		<div
			ref={ref}
			style={{ height: height > 0 ? height : undefined }}
			className="w-full relative border-b border-gray-200"
		>
			<div className="divide-y divide-gray-200 overflow-hidden">{height > 0 ? undefined : props.children}</div>
		</div>
	);
}

function LoadingIndicator(props: { onVisible: () => void }) {
	const { ref } = useInView({
		onChange(inView) {
			if (inView) {
				props.onVisible();
			}
		},
	});

	return (
		<div ref={ref} className="flex justify-center items-center h-16">
			<Spinner className="size-4" />
		</div>
	);
}

// TODO: Add header timestamps
