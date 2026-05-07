"use client";

import { create } from "zustand";

import { capitalize, formatRelativeDate } from "@/utils";

const useCount = create(() => 0);

if (typeof window !== "undefined") {
	setInterval(() => useCount.setState((count) => count + 1), 1000);
}

export function RelativeTimestamp(props: { timestamp: Date }) {
	useCount();

	return capitalize(formatRelativeDate(props.timestamp));
}
