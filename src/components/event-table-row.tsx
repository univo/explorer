"use client";

import { create } from "zustand";
import type { ReactNode, MouseEvent } from "react";

const useHoveredPrefix = create<string | null>(() => null);
const setHoveredPrefix = (id: string | null) => useHoveredPrefix.setState(id);

function hasClickableParentElement(element: HTMLElement) {
	let currentElement: HTMLElement = element;

	while (currentElement) {
		if (currentElement.nodeName === "A") return true;
		if (currentElement.nodeName === "BUTTON") return true;
		if (!currentElement.parentElement) return false;
		currentElement = currentElement.parentElement;
	}

	return false;
}

export function EventTableRow(props: { id: string; children: ReactNode }) {
	const hovered = useHoveredPrefix();
	const prefix = props.id.slice(0, 23); // Includes block number and tx id

	function handleClick(event: MouseEvent) {
		if (hasClickableParentElement(event.target as HTMLElement)) return;
	}

	return (
		<div
			data-hovered={String(hovered === prefix)}
			onMouseDown={(event) => handleClick(event)}
			onMouseLeave={() => setHoveredPrefix(null)}
			onMouseEnter={() => setHoveredPrefix(prefix)}
			className="flex overflow-hidden data-[hovered=true]:bg-gray-50"
		>
			{props.children}
		</div>
	);
}
