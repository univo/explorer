"use client";

import { create } from "zustand";
import { numberToHex } from "viem";
import type { ReactNode } from "react";
import { Fragment, Suspense } from "react";
import { useInView } from "react-intersection-observer";
import { createFromFetch } from "@tanstack/react-start/rsc";
import { useInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";

import { createId } from "@/helpers";
import { Spinner } from "@/components/spinner";
import { EtherscanIcon } from "@/components/icons";
import { IconButton } from "@/components/icon-button";
import { CloseViewButton } from "@/components/close-view-button";

export function AddressView(props: { address: `0x${string}` }) {
	return (
		<div className="h-full flex flex-col bg-white">
			<Header address={props.address} />
			<Suspense fallback={<p>Idk why this hows</p>}>
				<Events address={props.address} />
			</Suspense>
		</div>
	);
}

function Header(props: { address: `0x${string}` }) {
	return (
		<Suspense
			fallback={
				<div className="bg-white px-3 py-3 flex items-center justify-between border-b border-gray-200">
					<div className="flex items-center gap-2 overflow-hidden">
						<p className="text-gray-900 font-semibold text-base select-all">Account</p>
						<p className="text-gray-500 text-base select-all truncate">{props.address}</p>
					</div>

					<div className="flex items-center gap-2">
						<IconButton href={`https://etherscan.io/address/${props.address}`}>
							<EtherscanIcon className="shrink-0 size-4" />
						</IconButton>

						<CloseViewButton view={props.address} />
					</div>
				</div>
			}
		>
			<HeaderInner address={props.address} />
		</Suspense>
	);
}

function HeaderInner(props: { address: `0x${string}` }) {
	// Rn suspense queries are the only ones that don't cause the component to unmount briefly, not sure why

	const query = useSuspenseQuery({
		queryKey: ["AddressHeader", props.address],
		queryFn: () => createFromFetch(fetch(`/rsc/AddressHeader?address=${props.address}`)),
	});

	return query.data;
}

// We render a component with an initial cursor. It fetches and renders the event container that will
// publish the start and end cursors to a store. Whenever we bring the loading indicator into view It
// will get the latest cursor from the store and render this new component with that as the cursor

const useCursor = create(() => {
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
});

function Events(props: { address: `0x${string}` }) {
	const cursor = useCursor();

	const query = useInfiniteQuery({
		initialPageParam: cursor,
		getNextPageParam: () => cursor,
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
				return <Fragment key={index}>{page}</Fragment>;
			})}

			{query.hasNextPage && <LoadingIndicator onVisible={() => fetchNextPage()} />}
		</div>
	);
}

export function EventsContainer(props: { cursor: string; children: ReactNode }) {
	return props.children;
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
		<div ref={ref} className="flex justify-center items-center h-24">
			<Spinner className="size-4" />
		</div>
	);
}
