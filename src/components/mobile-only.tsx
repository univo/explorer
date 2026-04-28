import type { ComponentProps, ReactNode } from "react";

import { SkipRenderOnClient } from "./skip-render-on-client";

export function isMobile() {
	return window.innerWidth < 768;
}

type Props = ComponentProps<"div"> & {
	/**
	 * Optional override for the className passed to the mounted `<div>` element
	 * @default "md:hidden"
	 */
	className?: string;
	children: ReactNode;
};

export function MobileOnly(props: Props) {
	const { children, ...rest } = props;

	return (
		<SkipRenderOnClient className="md:hidden" shouldRenderOnClient={isMobile} {...rest}>
			{children}
		</SkipRenderOnClient>
	);
}
