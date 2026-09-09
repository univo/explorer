"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

import { createId } from "@/helpers";
import { numberToHex, raise } from "@/utils";
import { usePresetContext } from "./preset-context";

type CursorContextValue = {
	cursors: Map<string, string | null | undefined>;
	refreshCursors: () => void;
	insertNextCursor: (startCursor: string) => void;
	insertStopCursor: (startCursor: string, stopCursor: string | null) => void;
};

const CursorContext = createContext<CursorContextValue | null>(null);

export const useCursorContext = () => useContext(CursorContext) ?? raise("Missing CursorContext provider");

export function CursorContextProvider(props: { children: ReactNode }) {
	const preset = usePresetContext();

	return (
		<CursorContextProviderChild
			key={preset.value} // This forces the cursor context to reset whenever the preset changes
		>
			{props.children}
		</CursorContextProviderChild>
	);
}

function CursorContextProviderChild(props: { children: ReactNode }) {
	const [cursors, setCursors] = useState<Map<string, string | null | undefined>>(() => {
		// TODO: Add cache alignment to the initial cursor

		const initialCursor = createId({
			blockTimestamp: numberToHex(Math.floor(Date.now() / 1000)),
			tableId: 0, // Irrelevant
			chainId: "0x1", // Irrelevant but must specify a known chain id
			txIndex: "0x0", // Irrelevant
			logIndex: "0x0", // Irrelevant
			blockNumber: "0x0", // Irrelevant
		});

		return new Map().set(initialCursor, undefined);
	});

	function refreshCursors() {
		setCursors(() => {
			const initialCursor = createId({
				blockTimestamp: numberToHex(Math.floor(Date.now() / 1000)),
				tableId: 0, // Irrelevant
				chainId: "0x1", // Irrelevant but must specify a known chain id
				txIndex: "0x0", // Irrelevant
				logIndex: "0x0", // Irrelevant
				blockNumber: "0x0", // Irrelevant
			});

			return new Map().set(initialCursor, undefined);
		});
	}

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

	return <CursorContext value={{ cursors, refreshCursors, insertNextCursor, insertStopCursor }}>{props.children}</CursorContext>;
}
