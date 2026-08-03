"use client";

import type { ReactNode, MouseEvent } from "react";

import { useViewIndex, useViews } from "./views";

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
	const views = useViews();
	const index = useViewIndex();

	function handleClick(event: MouseEvent) {
		if (hasClickableParentElement(event.target as HTMLElement)) {
			return;
		}

		views.push(props.id, index);
	}

	return (
		<div onMouseDown={(event) => handleClick(event)} className="cursor-pointer flex overflow-hidden hover:bg-gray-50">
			{props.children}
		</div>
	);
}
