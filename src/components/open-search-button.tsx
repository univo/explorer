"use client";

import type { ComponentProps } from "react";

import { setSearchOpen } from "./search-dialog";

export function OpenSearchButton(props: ComponentProps<"button">) {
	return (
		<button {...props} onMouseDown={() => setSearchOpen(true)}>
			{props.children}
		</button>
	);
}
