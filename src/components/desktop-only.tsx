import type { ComponentProps, ReactNode } from "react";

import { SkipRenderOnClient } from "./skip-render-on-client";

export function isDesktop() {
	return window.innerWidth >= 768;
}

type Props = ComponentProps<"div"> & {
	/**
	 * Optional override for the className passed to the mounted `<div>` element
	 * @default "hidden md:block"
	 */
	className?: string;
	children: ReactNode;
};

export function DesktopOnly(props: Props) {
	const { children, ...rest } = props;

	return (
		<SkipRenderOnClient className="hidden md:block" shouldRenderOnClient={isDesktop} {...rest}>
			{children}
		</SkipRenderOnClient>
	);
}
