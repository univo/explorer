"use client";

import * as v from "valibot";
import { create } from "zustand";
import type { ComponentProps, ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate, useParams } from "@tanstack/react-router";
import { createContext, useContext, useRef, useState } from "react";

import { XIcon } from "./icons";
import { raise } from "@/utils";
import { parseId } from "@/helpers";
import { IconButton } from "./icon-button";
import { sf_getTxHash } from "@/functions";
import { AddressView } from "@/views/address-view";
import { TransactionView } from "@/views/tx-view";
import { BlockNumberViewSuspense } from "@/views/block-number-view";
import { AddressSchema, BlockNumberSchema, EventSchema, TransactionSchema } from "@/schema";

type View =
	| { type: "event"; data: string; raw: string }
	| { type: "block-number"; data: number; raw: string }
	| { type: "address"; data: `0x${string}`; raw: string }
	| { type: "transaction"; data: `0x${string}`; raw: string };

type ViewContextValue = {
	value: string[];
	clear(): Promise<void>;
	remove(view: string): Promise<void>;
	push(view: string, index: number | null): Promise<void>;
};

const ViewContext = createContext<ViewContextValue | null>(null);

export function ViewContextProvider(props: { children?: ReactNode }) {
	const navigate = useNavigate();
	const params = useParams({ from: "/$" });
	const getTxHash = useServerFn(sf_getTxHash);

	const [state, setState] = useState(() => {
		return {
			value: params._splat ? params._splat.split("/") : [],
		};
	});

	async function clear() {
		setState({ value: [] });
		await navigate({ to: `/$`, params: { _splat: undefined } });
	}

	async function remove(view: string) {
		const updated = state.value.filter((s) => s !== view);

		if (updated.length === state.value.length) {
			return; // View doesn't exist
		}

		const index = state.value.findIndex((s) => s === view);

		if (index === state.value.length - 1) {
			scrollToView(index - 1); // Scroll to previous view
		}

		setState({ value: updated });
		await navigate({ to: `/$`, params: { _splat: updated.join("/") } });
	}

	async function push(view: string, index: number | null): Promise<void> {
		const parsed = getView(view);

		if (parsed === null) {
			return; // Ignore invalid views
		}

		if (parsed.type === "event") {
			setState((state) => ({ ...state, status: "pending" }));

			const { block_timestamp, block_number, tx_index } = parseId(parsed.data);
			const tx = await getTxHash({ data: { block_timestamp, block_number, tx_index } });

			// We recursively push the tx view so that the next state update will remove the
			// loading status and push the new view in the same update

			return push(tx, index);
		}

		if (state.value.includes(view)) {
			return setState((state) => {
				scrollToView(state.value.findIndex((s) => s === view)); // Scroll to existing view
				return { ...state, status: "idle" };
			});
		}

		if (index === null) {
			return setState((state) => {
				scrollToView(state.value.length);
				const updated = [...state.value, view];
				navigate({ to: `/$`, params: { _splat: updated.join("/") } });
				return { status: "idle", value: updated };
			});
		}

		return setState((state) => {
			scrollToView(index + 1);
			const updated = [...state.value.filter((_, i) => i <= index), view];
			navigate({ to: "/$", params: { _splat: updated.join("/") } });
			return { status: "idle", value: updated };
		});
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

const useViewScroll = create<number | null>(() => null);
const markViewScrolled = () => useViewScroll.setState(null);
const scrollToView = (segment: number) => useViewScroll.setState(segment);

export function ViewsContainer(props: { children: ReactNode }) {
	const view = useViewScroll();
	const ref = useRef<HTMLDivElement>(null);

	const isScrolling = typeof view === "number";

	if (ref.current && view !== null) {
		const width = ref.current.scrollWidth / ref.current.childElementCount;
		const current = Math.floor(ref.current.scrollLeft / width);
		const align = view > current ? "right" : "left";
		const offset = align === "left" ? 0 : window.innerWidth - width;
		const target = view * width - offset;
		ref.current.scrollTo({ left: target, behavior: "smooth" });
		setTimeout(() => markViewScrolled(), 1000); // We have no good way to determine when smooth scroll completes
	}

	return (
		<div ref={ref} className="h-full flex overflow-x-auto scroll-smooth snap-x snap-mandatory">
			{props.children}

			{isScrolling && <div className="shrink-0 w-screen md:w-(--view-width)" />}
		</div>
	);
}

export function ViewContainer(props: { children: ReactNode }) {
	return (
		<div className="snap-start snap-always md:snap-align-none shrink-0 w-screen md:w-(--view-width) first:border-l border-r border-gray-200">
			{props.children}
		</div>
	);
}

function EmptyView() {
	return <div className="w-full h-full bg-white" />;
}

const ViewIndexContext = createContext<number | null>(null);

export const useViewIndex = () => useContext(ViewIndexContext);

export function View(props: { view: string; index: number }) {
	const view = getView(props.view);

	return (
		<ViewIndexContext value={props.index}>
			{view === null && <EmptyView />}
			{view !== null && view.type === "address" && <AddressView address={view.data} />}
			{view !== null && view.type === "transaction" && <TransactionView tx={view.data} />}
			{view !== null && view.type === "block-number" && <BlockNumberViewSuspense view={props.view} />}
		</ViewIndexContext>
	);
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
		<IconButton type="button" onMouseDown={() => views.remove(props.view)}>
			<XIcon className="shrink-0 size-4" />
		</IconButton>
	);
}

export function AddViewButton(props: { view: string } & ComponentProps<"button">) {
	const views = useViews();
	const index = useViewIndex();

	return (
		<button {...props} onMouseDown={() => views.push(props.view, index)}>
			{props.children}
		</button>
	);
}
