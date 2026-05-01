import * as v from "valibot";
import { create } from "zustand";
import { getAddress } from "viem";
import { useRef, type ReactNode } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";

import { isMobile } from "./mobile-only";
import { AddressView } from "@/views/address-view";
import { TransactionViewSuspense } from "@/views/tx-view";
import { BlockNumberViewSuspense } from "@/views/block-number-view";

export type View =
	| { type: "block-number"; data: number; view: string }
	| { type: "address"; data: `0x${string}`; view: string }
	| { type: "transaction"; data: `0x${string}`; view: string };

export const AddressSchema = v.pipe(
	v.custom<string>((val) => typeof val === "string" && val.startsWith("0x") && val.length === 42),
	v.transform((address) => getAddress(address as `0x${string}`)),
);

export const TransactionSchema = v.pipe(
	v.custom<string>((val) => typeof val === "string" && val.startsWith("0x") && val.length === 66),
	v.transform((tx) => tx as `0x${string}`),
);

export const BlockNumberSchema = v.pipe(
	v.string(),
	v.toNumber(),
	v.integer(),
	v.minValue(0),
	v.maxValue(1_000_000_000),
);

export function getView(view: string): View | null {
	// Defaults to Ethereum mainnet. We will need some way to specify chain

	const address = v.safeParse(AddressSchema, view);
	if (address.success) return { type: "address", data: address.output, view };

	const tx = v.safeParse(TransactionSchema, view);
	if (tx.success) return { type: "transaction", data: tx.output, view };

	const block_number = v.safeParse(BlockNumberSchema, view);
	if (block_number.success) return { type: "block-number", data: block_number.output, view };

	return null;
}

const VIEW_WIDTH = 608;

export function useViews() {
	const navigate = useNavigate();
	const params = useParams({ from: "/$" });

	return {
		async remove(view: string) {
			const views = params._splat ? params._splat.split("/") : [];
			const updated = views.filter((s) => s !== view);
			if (updated.length === views.length) return;
			const index = views.findIndex((s) => s === view);
			if (index === views.length - 1) scrollToView(index - 2);
			await navigate({ to: `/${updated.join("/")}` });
		},

		async push(view: string) {
			if (isMobile()) {
				return await navigate({ to: "/$", params: { _splat: view } });
			}

			const views = params._splat ? params._splat.split("/") : [];

			if (views.includes(view)) {
				const index = views.findIndex((s) => s === view);
				scrollToView(index);
				return;
			}

			const count = views.push(view);
			scrollToView(count - 1);
			await navigate({ to: `/${views.join("/")}` });
		},
	};
}

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
