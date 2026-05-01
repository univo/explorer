"use client";

import { useEffect, useReducer } from "react";
import { capitalize, formatRelativeDate } from "@/utils";

// TODO: Use a single interval and update globally
// TODO: If the delta is greater than a minute then only update every minute

function useRerender(ms: number) {
	const [, increment] = useReducer((state) => state + 1, 0);

	useEffect(() => {
		const id = setInterval(increment, ms);
		return () => clearInterval(id);
	}, [ms]);
}

export function RelativeTimestamp(props: { timestamp: Date }) {
	useRerender(1000);

	return capitalize(formatRelativeDate(props.timestamp));
}
