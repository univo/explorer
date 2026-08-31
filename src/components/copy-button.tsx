"use client";

import { useEffect, useState } from "react";

import { IconButton } from "./icon-button";
import { CheckIcon, CopyIcon } from "./icons";

type CopyState =
	| { status: "initial" } //
	| { status: "copied"; timestamp: number };

const SUCCESS_DURATION_MS = 2_000;

export function CopyButton(props: { value: string }) {
	const [state, setState] = useState<CopyState>({ status: "initial" });

	async function copyValueToClipboard() {
		setState({ status: "copied", timestamp: Date.now() });
		await navigator.clipboard.writeText(props.value);
	}

	useEffect(() => {
		if (state.status === "copied") {
			const id = setTimeout(() => setState({ status: "initial" }), SUCCESS_DURATION_MS);

			return () => clearTimeout(id);
		}
	});

	if (state.status === "copied" && Date.now() - state.timestamp < SUCCESS_DURATION_MS) {
		return (
			<IconButton>
				<CheckIcon className="shrink-0 size-4 text-green-500" />
			</IconButton>
		);
	}

	return (
		<IconButton onClick={copyValueToClipboard}>
			<CopyIcon className="shrink-0 size-4" />
		</IconButton>
	);
}
