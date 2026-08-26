import type { ReactNode } from "react";

import { ExclamationIcon } from "./icons";

export function Description(props: { success?: boolean; children: ReactNode }) {
	return (
		<div className="flex items-center flex-wrap wrap-anywhere text-sm text-gray-900 gap-1">
			{props.success === false ? <ExclamationIcon className="size-4 text-red-500" /> : null}
			{props.children}
		</div>
	);
}
