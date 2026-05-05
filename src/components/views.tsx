import * as v from "valibot";
import { create } from "zustand";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { createContext, useContext, useRef, useState } from "react";

import { raise } from "@/utils";
import { isMobile } from "./mobile-only";
import { AddressView } from "@/views/address-view";
import { TransactionViewSuspense } from "@/views/tx-view";
import { BlockNumberViewSuspense } from "@/views/block-number-view";
import { AddressSchema, BlockNumberSchema, TransactionSchema } from "@/schema";

type View =
	| { type: "event"; data: string; raw: string }
	| { type: "block-number"; data: number; raw: string }
	| { type: "address"; data: `0x${string}`; raw: string }
	| { type: "transaction"; data: `0x${string}`; raw: string };

type ViewContextValue = {
	value: string[];
	status: "idle" | "pending";
	push(view: string): Promise<void>;
	remove(view: string): Promise<void>;
};

const ViewContext = createContext<ViewContextValue | null>(null);

export function ViewContextProvider(props: { children?: ReactNode }) {
	const navigate = useNavigate();
	const params = useParams({ from: "/$" });

	const [state, setState] = useState(() => {
		return {
			status: "idle" as const,
			value: params._splat ? params._splat.split("/") : [],
		};
	});

	const value = {
		value: state.value,

		status: state.status,

		async remove(view: string) {
			const updated = state.value.filter((s) => s !== view);
			if (updated.length === state.value.length) return;
			const index = state.value.findIndex((s) => s === view);
			if (index === state.value.length - 1) scrollToView(index - 2);
			setState((state) => ({ ...state, value: updated }));
			await navigate({ to: `/${updated.join("/")}` });
		},

		async push(view: string) {
			if (isMobile()) {
				setState((state) => ({ ...state, value: [view] }));
				await navigate({ to: "/$", params: { _splat: view } });
				return;
			}

			if (state.value.includes(view)) {
				const index = state.value.findIndex((s) => s === view);
				scrollToView(index);
				return;
			}

			scrollToView(state.value.length);
			setState((state) => ({ ...state, value: [...state.value, view] }));
			await navigate({ to: `/${[...state.value, view].join("/")}` });
		},
	};

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
	const views = useViews();
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

			{views.status === "pending" && <EmptyView />}

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

function EmptyView() {
	return <div className="w-full h-full bg-white" />;
}

export function View(props: { view: string }) {
	const view = getView(props.view);

	if (view === null) return <EmptyView />;
	if (view.type === "address") return <AddressView address={view.data} />;
	if (view.type === "transaction") return <TransactionViewSuspense view={props.view} />;
	if (view.type === "block-number") return <BlockNumberViewSuspense view={props.view} />;
}
