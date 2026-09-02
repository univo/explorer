"use client";

import * as v from "valibot";
import { create } from "zustand";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { ComponentProps, ReactNode } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";

import { XIcon } from "./icons";
import { parseId } from "@/helpers";
import { IconButton } from "./icon-button";
import { sf_getTxPosition } from "@/functions";
import { AddressClient } from "@/frames/address/address-client";
import { TxPositionClient } from "@/frames/tx-position/tx-position-client";
import { BlockNumberClient } from "@/frames/block-number/block-number-client";
import { FrameContext, FrameIndexContext, useFrameIndex, useFrames } from "@/frames/context";
import { AddressSchema, BlockNumberSchema, EventSchema, TxHashSchema, TxPositionSchema } from "@/schema";

export type Frame =
	| { type: "event"; data: string; raw: string }
	| { type: "block-number"; data: number; raw: string }
	| { type: "address"; data: `0x${string}`; raw: string }
	| { type: "transaction-hash"; data: `0x${string}`; raw: string }
	| { type: "transaction-position"; data: { block: number; tx: number }; raw: string };

export function FrameContextProvider(props: { children?: ReactNode }) {
	const navigate = useNavigate();
	const params = useParams({ from: "/$" });
	const getTxPosition = useServerFn(sf_getTxPosition);

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

	async function push(frame: string, index: number | null): Promise<void> {
		const parsed = getFrame(frame);

		if (parsed === null) {
			return; // Ignore invalid frames
		}

		if (parsed.type === "event") {
			setState((state) => ({ ...state, status: "pending" }));

			const { blockNumber, txIndex } = parseId(parsed.data);

			return push(`${blockNumber}-${txIndex}`, index);
		}

		if (parsed.type === "transaction-hash") {
			setState((state) => ({ ...state, status: "pending" }));

			const position = await getTxPosition({ data: { tx_hash: parsed.data } });

			// We recursively push the tx frame so that the next state update will remove the
			// loading status and push the new frame in the same update

			return push(`${position.block}-${position.tx}`, index);
		}

		if (state.value.includes(frame)) {
			return setState((state) => {
				scrollToFrame(state.value.findIndex((s) => s === frame)); // Scroll to existing frame
				return { ...state, status: "idle" };
			});
		}

		if (index === null) {
			return setState((state) => {
				scrollToFrame(state.value.length);
				const updated = [...state.value, frame];
				navigate({ to: `/$`, params: { _splat: updated.join("/") } });
				return { status: "idle", value: updated };
			});
		}

		return setState((state) => {
			scrollToFrame(index + 1);
			const updated = [...state.value.filter((_, i) => i <= index), frame];
			navigate({ to: "/$", params: { _splat: updated.join("/") } });
			return { status: "idle", value: updated };
		});
	}

	const value = { ...state, push, remove, clear };

	return <FrameContext value={value}>{props.children}</FrameContext>;
}

export function getFrame(frame: string): Frame | null {
	// Defaults to Ethereum mainnet. We will need some way to specify chain

	const address = v.safeParse(AddressSchema, frame);
	if (address.success) return { type: "address", data: address.output, raw: frame };

	const tx_hash = v.safeParse(TxHashSchema, frame);
	if (tx_hash.success) return { type: "transaction-hash", data: tx_hash.output, raw: frame };

	const tx_position = v.safeParse(TxPositionSchema, frame);
	if (tx_position.success) return { type: "transaction-position", data: tx_position.output, raw: frame };

	const block_number = v.safeParse(BlockNumberSchema, frame);
	if (block_number.success) return { type: "block-number", data: block_number.output, raw: frame };

	const event = v.safeParse(EventSchema, frame);
	if (event.success) return { type: "event", data: event.output, raw: frame };

	return null;
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

			{frame !== null && frame.type === "block-number" && <BlockNumberClient number={frame.data} />}

			{frame !== null && frame.type === "transaction-position" && <TxPositionClient block={frame.data.block} tx={frame.data.tx} />}
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
