"use client";

import * as v from "valibot";
import { create } from "zustand";
import type { ComponentProps, ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate, useParams } from "@tanstack/react-router";
import { createContext, useContext, useRef, useState } from "react";

import { raise } from "@/utils";
import { parseId } from "@/helpers";
import { isMobile } from "./mobile-only";
import { sf_getTxHash } from "@/functions";
import { AddressView } from "@/views/address-view";
import { TransactionView } from "@/views/tx-view";
import { BlockNumberViewSuspense } from "@/views/block-number-view";
import { AddressSchema, BlockNumberSchema, EventSchema, TransactionSchema } from "@/schema";
import { DesktopOnly } from "./desktop-only";
import { IconButton } from "./icon-button";
import { XIcon } from "./icons";

type View =
	| { type: "event"; data: string; raw: string }
	| { type: "block-number"; data: number; raw: string }
	| { type: "address"; data: `0x${string}`; raw: string }
	| { type: "transaction"; data: `0x${string}`; raw: string };

type ViewContextValue = {
	value: string[];
	status: "idle" | "pending";
	clear(): Promise<void>;
	push(view: string): Promise<void>;
	remove(view: string): Promise<void>;
};

const ViewContext = createContext<ViewContextValue | null>(null);

export function ViewContextProvider(props: { children?: ReactNode }) {
	const navigate = useNavigate();
	const params = useParams({ from: "/$" });
	const getTxHash = useServerFn(sf_getTxHash);

	const [state, setState] = useState(() => {
		return {
			status: "idle" as ViewContextValue["status"],
			value: params._splat ? params._splat.split("/") : [],
		};
	});

	async function clear() {
		setState({ status: "idle", value: [] });
		await navigate({ to: `/$`, params: { _splat: undefined } });
	}

	async function remove(view: string) {
		const updated = state.value.filter((s) => s !== view);

		if (updated.length === state.value.length) {
			return; // View doesn't exist
		}

		const index = state.value.findIndex((s) => s === view);

		if (index === state.value.length - 1) {
			scrollToView(index - 2);
		}

		setState({ status: "idle", value: updated });
		await navigate({ to: `/$`, params: { _splat: updated.join("/") } });
	}

	async function push(view: string): Promise<void> {
		const parsed = getView(view);

		if (parsed === null) {
			return; // Ignore invalid views
		}

		if (parsed.type === "event") {
			setState((state) => ({ ...state, status: "pending" })); // Force loading state
			scrollToView(state.value.length); // Scroll to the loading state view

			const { block_timestamp, block_number, tx_index } = parseId(parsed.data);
			const tx = await getTxHash({ data: { block_timestamp, block_number, tx_index } });

			// We recursively push the tx view so that the next state update will remove the
			// loading status and push the new view in the same update

			return push(tx);
		}

		if (isMobile()) {
			setState({ status: "idle", value: [view] });
			await navigate({ to: "/$", params: { _splat: view } });
			return;
		}

		if (state.value.includes(view)) {
			scrollToView(state.value.findIndex((s) => s === view)); // Scroll to existing view
			setState((state) => ({ ...state, status: "idle" }));
			return;
		}

		scrollToView(state.value.length);
		setState((state) => ({ status: "idle", value: [...state.value, view] }));
		await navigate({ to: `/$`, params: { _splat: [...state.value, view].join("/") } });
	}

	const value = { ...state, push, remove, clear };

	return <ViewContext value={value}>{props.children}</ViewContext>;
}

export function useViews() {
	return useContext(ViewContext) ?? raise("Missing ViewContextProvider");
}

export function getView(view: string): View | null {
	// Defaults to Ethereum mainnet. We will need some way to specify chain

	const address = v.safeParse(AddressSchema, view);
	if (address.success) return { type: "address", data: address.output, raw: view };

	const tx = v.safeParse(TransactionSchema, view);
	if (tx.success) return { type: "transaction", data: tx.output, raw: view };

	const block_number = v.safeParse(BlockNumberSchema, view);
	if (block_number.success) return { type: "block-number", data: block_number.output, raw: view };

	const event = v.safeParse(EventSchema, view);
	if (event.success) return { type: "event", data: event.output, raw: view };

	return null;
}

const VIEW_WIDTH = 608;

// We update the push function to accept a specific view type. It will handle searching the tx
// hash based on the block number and tx id.

// It will also return a loading state if a new view is being pushed. This loading state will be
// used to render a loading view in the view container. We use regular state for this to issue updates.

// This function also becomes the source of the view state by reading the query params as the initial state.
// Whenever we push, we need to push to both the state and the url. This allows us to remove the loading state
// and push the new view in the same update to prevent a flash of content. We'll need this hook to be a
// context provider to prevent multiple versions existing from different consumer components

// Use a useRef to prevent duplicate in-flight calls for the same block number + tx index

const useViewScroll = create<number | null>(() => null);
const markViewScrolled = () => useViewScroll.setState(null);
const scrollToView = (segment: number) => useViewScroll.setState(segment);

export function ViewsContainer(props: { children: ReactNode }) {
	const view = useViewScroll();
	const ref = useRef<HTMLDivElement>(null);

	if (ref.current && view !== null) {
		const current = Math.floor(ref.current.scrollLeft / VIEW_WIDTH);
		const align = view > current ? "right" : "left";
		const offset = align === "left" ? 0 : window.innerWidth - VIEW_WIDTH;
		const left = view * VIEW_WIDTH - offset;
		ref.current.scrollTo({ left, behavior: "smooth" });
		setTimeout(() => markViewScrolled(), 1000); // We have no good way to determine when smooth scroll completes
	}

	return (
		<div ref={ref} className="h-full flex overflow-x-auto scroll-smooth">
			{props.children}

			<PendingView />

			<div className="hidden md:block h-full min-w-(--view-width) w-(--view-width) border-r border-gray-200 border-dashed" />

			{typeof view === "number" && (
				<div className="hidden md:block h-full min-w-(--view-width) w-(--view-width) border-r border-gray-200 border-dashed" />
			)}

			{typeof view === "number" && (
				<div className="hidden md:block h-full min-w-(--view-width) w-(--view-width) border-r border-gray-200 border-dashed" />
			)}
		</div>
	);
}

export function ViewContainer(props: { children: ReactNode }) {
	return (
		<div className="border-r border-gray-200 w-screen md:min-w-(--view-width) md:w-(--view-width)">
			{props.children}
		</div>
	);
}

function PendingView() {
	const views = useViews();

	if (isMobile()) {
		return undefined;
	}

	if (views.status === "idle") {
		return undefined;
	}

	return (
		<ViewContainer>
			<EmptyView />
		</ViewContainer>
	);
}

function EmptyView() {
	return <div className="w-full h-full bg-white" />;
}

export function View(props: { view: string }) {
	const view = getView(props.view);

	if (view === null) return <EmptyView />;
	if (view.type === "address") return <AddressView address={view.data} />;
	if (view.type === "transaction") return <TransactionView tx={view.data} />;
	if (view.type === "block-number") return <BlockNumberViewSuspense view={props.view} />;
}

export function ClearViewsButton(props: { children?: ReactNode }) {
	const views = useViews();

	return (
		<button type="button" onMouseDown={() => views.clear()} className="cursor-pointer">
			{props.children}
		</button>
	);
}

export function CloseViewButton(props: { view: string }) {
	const views = useViews();

	return (
		<DesktopOnly>
			<IconButton type="button" onMouseDown={() => views.remove(props.view)}>
				<XIcon className="shrink-0 size-4" />
			</IconButton>
		</DesktopOnly>
	);
}

export function AddViewButton(props: { view: string } & ComponentProps<"button">) {
	const views = useViews();

	return (
		<button {...props} onMouseDown={() => views.push(props.view)}>
			{props.children}
		</button>
	);
}
