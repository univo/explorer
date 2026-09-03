"use client";

import clsx from "clsx";
import { Fragment } from "react";
import type { MouseEvent, ReactNode } from "react";

import { parseId } from "@/helpers";
import { Timestamp } from "./timestamp";
import { RelativeTimestamp } from "./relative-timestamp";
import { useFrameIndex, useFrames } from "@/frames/context";

export function EventTableRow(props: { id: string; previousId: string; children: ReactNode }) {
	const frames = useFrames();
	const index = useFrameIndex();

	function handleClick(event: MouseEvent) {
		if (hasClickableParentElement(event.target as HTMLElement)) {
			return;
		}

		frames.push(props.id, index);
	}

	const timestamp = new Date(parseId(props.id).blockTimestamp * 1000);
	const previousTimestamp = new Date(parseId(props.previousId).blockTimestamp * 1000);
	const eventDay = timestamp.toLocaleDateString("en", { day: "numeric" });
	const previousEventDay = previousTimestamp.toLocaleDateString("en", { day: "numeric" });
	const showSeparator = eventDay !== previousEventDay;

	return (
		<Fragment>
			{showSeparator && (
				<div className="flex items-center justify-between px-3 h-8 bg-gray-100 sticky top-0 z-10">
					<p className="text-sm text-gray-500 font-normal text-nowrap select-all">
						<Timestamp date utc={timestamp} />
					</p>

					<HeaderTimestamp utc={timestamp} />
				</div>
			)}

			<div
				onMouseDown={(event) => handleClick(event)} //
				className={clsx(
					"cursor-pointer flex overflow-hidden hover:bg-gray-50",
					showSeparator === false && "not-first:border-t not-first:border-gray-200",
				)}
			>
				{props.children}
			</div>
		</Fragment>
	);
}

const ONE_DAY = 24 * 60 * 60 * 1000;

function HeaderTimestamp(props: { utc: Date }) {
	const delta = Date.now() - props.utc.getTime();

	if (delta < ONE_DAY) {
		return;
	}

	return (
		<p className="text-sm text-gray-500 font-normal text-nowrap select-all text-right">
			<RelativeTimestamp utc={props.utc} />
		</p>
	);
}

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
