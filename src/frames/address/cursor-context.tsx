"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

import { raise } from "@/utils";
import type { EventId } from "@/events";
import { REVERSE_TABLES } from "@/constants";
import { usePresetContext } from "./preset-context";

type CursorContextValue = {
	cursors: Map<EventId, EventId | null | undefined>;
	refreshCursors: () => void;
	insertNextCursor: (startCursor: EventId) => void;
	insertStopCursor: (startCursor: EventId, stopCursor: EventId | null) => void;
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
	const [cursors, setCursors] = useState<Map<EventId, EventId | null | undefined>>(() => {
		// TODO: Add cache alignment to the initial cursor

		const initialCursor: EventId = {
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
			const initialCursor: EventId = {
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

	function insertNextCursor(startCursor: EventId) {
		setCursors((cursors) => {
			const result = new Map(cursors); // Must be a new map to force react to rerender
			result.set(startCursor, undefined);
			return result;
		});
	}

	function insertStopCursor(startCursor: EventId, stopCursor: EventId | null) {
		setCursors((cursors) => {
			const result = new Map(cursors); // Must be a new map to force react to rerender
			result.set(startCursor, stopCursor);
			return result;
		});
	}

	return <CursorContext value={{ cursors, refreshCursors, insertNextCursor, insertStopCursor }}>{props.children}</CursorContext>;
}
