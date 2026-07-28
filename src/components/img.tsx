"use client";

import { useState } from "react";

export function Img(props: { src: string | undefined; alt?: string; fallback?: string }) {
	const [src, setSrc] = useState(props.src);

	function onError() {
		if (props.fallback === undefined) {
			return;
		}

		setSrc(props.fallback);
	}

	return (
		<img
			alt={props.alt}
			onError={onError}
			src={src || props.fallback || "/img/fallback/svg"} //
		/>
	);
}
