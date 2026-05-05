"use client";

import { numberToHex } from "viem";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { createFromFetch } from "@tanstack/react-start/rsc";
import { createContext, Suspense, useContext, useEffect, useState } from "react";

import { raise } from "@/utils";
import { createId } from "@/helpers";
import { Spinner } from "@/components/spinner";
import { EtherscanIcon } from "@/components/icons";
import { CloseViewButton } from "@/components/views";
import { IconButton } from "@/components/icon-button";

export function AddressView(props: { address: `0x${string}` }) {
	return (
		<div className="h-full flex flex-col bg-white">
			<Header address={props.address} />
			<Events address={props.address} />
		</div>
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

type CursorContextValue = {
	cursors: Map<string, string | null | undefined>;
	insertNextCursor: (startCursor: string) => void;
	insertStopCursor: (startCursor: string, stopCursor: string | null) => void;
};

const CursorContext = createContext<CursorContextValue | null>(null);

function Events(props: { address: `0x${string}` }) {
	const [cursors, setCursors] = useState<Map<string, string | null | undefined>>(() => {
		// TODO: Add cache alignment to the initial cursor

		const initialCursor = createId({
			block_timestamp: numberToHex(Math.floor(Date.now() / 1000)),
			table_id: 0, // Irrelevant
			chain_id: "0x1", // Irrelvant but must specify a known chain id
			tx_index: "0x0", // Irrelevant
			log_index: "0x0", // Irrelevant
			block_number: "0x0", // Irrelevant
		});

		return new Map().set(initialCursor, undefined);
	});

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
		<CursorContext value={{ cursors, insertNextCursor, insertStopCursor }}>
			<div className="relative grow overflow-scroll isolate">
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
		</CursorContext>
	);
}

function getNextCursor(cursors: Map<string, string | null | undefined>): string | null {
	let final_cursor: string | undefined;

	for (const [key, value] of cursors) {
		if (value === null) return null;
		if (value === undefined) return key;
		final_cursor = value;
	}

	if (final_cursor === undefined) {
		throw new Error("Expected atleast the initial cursor");
	}

	return final_cursor;
}

function EventsContainer(props: { address: `0x${string}`; startCursor: string }) {
	const query = useQuery({
		queryKey: ["AddressEvents", props.address, props.startCursor],
		queryFn: () => createFromFetch(fetch(`/rsc/AddressEvents?address=${props.address}&cursor=${props.startCursor}`)),
	});

	if (query.status === "error") {
		return undefined;
	}

	if (query.status === "pending") {
		return undefined;
	}

	return (
		<Suspense>
			<VirtualisationContainer>{query.data}</VirtualisationContainer>
		</Suspense>
	);
}

// The component allows the server to provide cursor related information back to the client

export function StopCursorContainer(props: { startCursor: string; stopCursor: string | null; children?: ReactNode }) {
	const context = useContext(CursorContext) ?? raise("Missing CursorContext provider");

	useEffect(() => {
		if (getNextCursor(context.cursors) === props.startCursor) {
			context.insertStopCursor(props.startCursor, props.stopCursor);
		}
	});

	return props.children;
}

function VirtualisationContainer(props: { children: ReactNode }) {
	const [height, setHeight] = useState(0);

	const { ref } = useInView({
		// We could probably add margin here to prevent the flash as hidden blocks return. Also note that this
		// virtualisation happens according to the document as the root, which means it applies to horizontal
		// scrolling too when we have a large number of horizontal views
		rootMargin: "0px 608px 0px 608px",

		// This is pretty safe because our app never sees a lot of browser resizing. On desktop the width of each
		// view is static. On mobile the only way to resize is to adjust the orientation.
		onChange: (inView, entry) => setHeight(inView ? 0 : entry.boundingClientRect.height),
	});

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

function NoMoreEvents() {
	return (
		<div className="flex items-center justify-center h-16">
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
		<div ref={ref} className="flex justify-center items-center h-16">
			<Spinner className="size-4" />
		</div>
	);
}
