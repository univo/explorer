"use client";

import { create } from "zustand";
import { useRef, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";

import { XIcon } from "../components/icons";
import { getFrame } from "./frame";
import { IconButton } from "../components/icon-button";
import { AddressClient } from "@/frames/3-address/3-address-client";
import { TxPositionClient } from "@/frames/1-chain-tx-position/1-chain-tx-position-client";
import { BlockNumberClient } from "@/frames/2-chain-block-number/2-chain-block-number-client";
import { TxHashClient } from "@/frames/4-chain-tx-hash/4-chain-tx-hash-client";
import { FrameContext, FrameIndexContext, useFrameIndex, useFrames } from "@/frames/frame-context";

export function FrameContextProvider(props: { children?: ReactNode }) {
	const navigate = useNavigate();
	const params = useParams({ from: "/$" });

	const [state, setState] = useState(() => {
		return {
			value: params._splat ? params._splat.split("/") : [],
		};
	});

	async function clear() {
		setState({ value: [] });
		await navigate({ to: `/$`, params: { _splat: undefined } });
	}

	async function remove(index: number | null) {
		if (index === null) {
			return; // Can't remember why I made index nullable
		}

		const updated = state.value.filter((_, i) => i !== index);

		if (updated.length === state.value.length) {
			return; // Frame doesn't exist
		}

		if (index === state.value.length - 1) {
			scrollToFrame(index - 1); // Scroll to previous frame
		}

		setState({ value: updated });

		await navigate({ to: `/$`, params: { _splat: updated.join("/") } });
	}

	async function push(rawFrame: string, index: number | null): Promise<void> {
		const parsed = getFrame(rawFrame);

		if (parsed === null) {
			return; // Ignore invalid frames
		}

		if (state.value.includes(rawFrame)) {
			return setState((state) => {
				scrollToFrame(state.value.findIndex((s) => s === rawFrame)); // Scroll to existing frame
				return { ...state, status: "idle" };
			});
		}

		if (index === null) {
			return setState((state) => {
				scrollToFrame(state.value.length);
				const updated = [...state.value, rawFrame];
				navigate({ to: `/$`, params: { _splat: updated.join("/") } });
				return { status: "idle", value: updated };
			});
		}

		return setState((state) => {
			scrollToFrame(index + 1);
			const updated = [...state.value.filter((_, i) => i <= index), rawFrame];
			navigate({ to: "/$", params: { _splat: updated.join("/") } });
			return { status: "idle", value: updated };
		});
	}

	const value = { ...state, push, remove, clear };

	return <FrameContext value={value}>{props.children}</FrameContext>;
}

const useFrameScroll = create<number | null>(() => null);
const markFrameScrolled = () => useFrameScroll.setState(null);
const scrollToFrame = (segment: number) => useFrameScroll.setState(segment);

export function FramesContainer(props: { children: ReactNode }) {
	const frame = useFrameScroll();
	const ref = useRef<HTMLDivElement>(null);

	const isScrolling = typeof frame === "number";

	if (ref.current && frame !== null) {
		const width = ref.current.scrollWidth / ref.current.childElementCount;
		const current = Math.floor(ref.current.scrollLeft / width);
		const align = frame > current ? "right" : "left";
		const offset = align === "left" ? 0 : window.innerWidth - width;
		const target = frame * width - offset;
		ref.current.scrollTo({ left: target, behavior: "smooth" });
		setTimeout(() => markFrameScrolled(), 1000); // We have no good way to determine when smooth scroll completes
	}

	return (
		<div ref={ref} className="h-full flex overflow-x-auto scroll-smooth snap-x snap-mandatory">
			{props.children}

			{isScrolling && <div className="shrink-0 w-screen md:w-(--frame-width)" />}
		</div>
	);
}

export function FrameContainer(props: { children: ReactNode }) {
	return (
		<div className="snap-start snap-always md:snap-align-none shrink-0 w-screen md:w-(--frame-width) first:border-l border-r border-gray-200">
			{props.children}
		</div>
	);
}

function EmptyFrame() {
	return <div className="w-full h-full bg-white" />;
}

export function Frame(props: { frame: string; index: number }) {
	const frame = getFrame(props.frame);

	return (
		<FrameIndexContext value={props.index}>
			{frame === null && <EmptyFrame />}

			{frame !== null && frame.type === "address" && <AddressClient address={frame.data} />}

			{frame !== null && frame.type === "chain-block-number" && <BlockNumberClient chain={frame.data.chain} number={frame.data.block} />}

			{frame !== null && frame.type === "chain-tx-position" && (
				<TxPositionClient chain={frame.data.chain} block={frame.data.block} tx={frame.data.tx} />
			)}

			{frame !== null && frame.type === "chain-tx-hash" && <TxHashClient chain={frame.data.chain} tx_hash={frame.data.tx_hash} />}
		</FrameIndexContext>
	);
}

export function ClearFramesButton(props: { children?: ReactNode }) {
	const frames = useFrames();

	return (
		<button type="button" onMouseDown={() => frames.clear()} className="cursor-pointer">
			{props.children}
		</button>
	);
}

export function CloseFrameButton() {
	const frames = useFrames();
	const index = useFrameIndex();

	return (
		<IconButton type="button" onMouseDown={() => frames.remove(index)}>
			<XIcon className="shrink-0 size-4" />
		</IconButton>
	);
}

export function AddFrameButton(props: { frame: string } & ComponentProps<"button">) {
	const frames = useFrames();
	const index = useFrameIndex();

	return (
		<button {...props} onMouseDown={() => frames.push(props.frame, index)}>
			{props.children}
		</button>
	);
}
