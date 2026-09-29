"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

import { raise } from "@/utils";
import type { Event } from "@/events";
import { REVERSE_TABLES } from "@/constants";
import { usePresetContext } from "./preset-context";

type CursorContextValue = {
	cursors: Map<Event, Event | null | undefined>;
	refreshCursors: () => void;
	insertNextCursor: (startCursor: Event) => void;
	insertStopCursor: (startCursor: Event, stopCursor: Event | null) => void;
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
	const [cursors, setCursors] = useState<Map<Event, Event | null | undefined>>(() => {
		// TODO: Add cache alignment to the initial cursor

		const initialCursor: Event = {
			chain: 1,
			tx_index: 0,
			log_index: 0,
			block_number: 0,
			tag: REVERSE_TABLES[0],
			block_timestamp: new Date(),
		};

		return new Map().set(initialCursor, undefined);
	});

	function refreshCursors() {
		setCursors(() => {
			const initialCursor: Event = {
				chain: 1,
				tx_index: 0,
				log_index: 0,
				block_number: 0,
				tag: REVERSE_TABLES[0],
				block_timestamp: new Date(),
			};

			return new Map().set(initialCursor, undefined);
		});
	}

	function insertNextCursor(startCursor: Event) {
		setCursors((cursors) => {
			const result = new Map(cursors); // Must be a new map to force react to rerender
			result.set(startCursor, undefined);
			return result;
		});
	}

	function insertStopCursor(startCursor: Event, stopCursor: Event | null) {
		setCursors((cursors) => {
			const result = new Map(cursors); // Must be a new map to force react to rerender
			result.set(startCursor, stopCursor);
			return result;
		});
	}

	return <CursorContext value={{ cursors, refreshCursors, insertNextCursor, insertStopCursor }}>{props.children}</CursorContext>;
}
