import { useState } from "react";

export function Img(props: { src: string | null; alt?: string; fallback?: string }) {
	const [src, setSrc] = useState(() => {
		if (props.src === null) {
			if (props.fallback === undefined) {
				return null;
			}

			return props.fallback;
		}

		return props.src;
	});

	if (src === null) {
		return null;
	}

	function onError() {
		if (props.fallback === undefined) {
			return;
		}

		setSrc(props.fallback);
	}

	return <img src={src} alt={props.alt} onError={onError} />;
}
