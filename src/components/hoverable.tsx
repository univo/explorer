"use client";

import { create } from "zustand";
import type { ReactNode } from "react";

const useHoveredId = create<string | null>(() => null);
const setId = (key: string | null) => useHoveredId.setState(key);

export function Hoverable(props: { children: ReactNode; id: string }) {
	const id = useHoveredId();

	return (
		<div
			onMouseLeave={() => setId(null)}
			onMouseEnter={() => setId(props.id)}
			data-hovered={String(id === props.id)}
			className="px-px rounded data-[hovered=true]:bg-gray-200"
		>
			{props.children}
		</div>
	);
}
