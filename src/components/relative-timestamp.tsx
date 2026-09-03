"use client";

import { create } from "zustand";

import { capitalize } from "@/utils";

const useCount = create(() => 0);

if (typeof window !== "undefined") {
	setInterval(() => useCount.setState((count) => count + 1), 1000);
}

export function RelativeTimestamp(props: { utc: Date }) {
	useCount();

	return capitalize(formatRelativeDate(props.utc));
}

const unit_strings = ["s", "m", "hr", "d", "w", "mo", "yr"] as const;
const units_seconds = [60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Number.POSITIVE_INFINITY];

function formatRelativeDate(date: Date) {
	const delta_seconds = Math.round((date.getTime() - Date.now()) / 1000);
	const unit_index = units_seconds.findIndex((cutoff) => cutoff > Math.abs(delta_seconds));
	const divisor = unit_index ? units_seconds[unit_index - 1]! : 1;
	return `${Math.abs(Math.round(delta_seconds / divisor))}${unit_strings[unit_index]}`;
}
