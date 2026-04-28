import type { ReactNode } from "react";

export function Description(props: { children: ReactNode }) {
	return <div className="flex items-center flex-wrap wrap-anywhere text-sm text-gray-900 gap-1">{props.children}</div>;
}
