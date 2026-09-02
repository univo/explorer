"use client";

import type { ReactNode, MouseEvent } from "react";

import { useFrameIndex, useFrames } from "@/frames/context";

function hasClickableParentElement(element: HTMLElement) {
	let currentElement: HTMLElement = element;

	while (currentElement) {
		if (currentElement.nodeName === "A") {
			return true;
		}

		if (currentElement.nodeName === "BUTTON") {
			return true;
		}

		if (!currentElement.parentElement) {
			return false;
		}

		currentElement = currentElement.parentElement;
	}

	return false;
}

export function EventTableRow(props: { id: string; children: ReactNode }) {
	const frames = useFrames();
	const index = useFrameIndex();

	function handleClick(event: MouseEvent) {
		if (hasClickableParentElement(event.target as HTMLElement)) {
			return;
		}

		frames.push(props.id, index);
	}

	return (
		<div onMouseDown={(event) => handleClick(event)} className="cursor-pointer flex overflow-hidden hover:bg-gray-50">
			{props.children}
		</div>
	);
}
