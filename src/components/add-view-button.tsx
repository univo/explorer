"use client";

import type { ComponentProps } from "react";

import { useViews } from "./views";

export function AddViewButton(props: { view: string } & ComponentProps<"button">) {
	const views = useViews();

	return (
		<button {...props} onClick={() => views.push(props.view)}>
			{props.children}
		</button>
	);
}
