"use client";

import { useViews } from "./views";
import { XIcon } from "@/components/icons";
import { IconButton } from "./icon-button";
import { DesktopOnly } from "./desktop-only";

export function CloseViewButton(props: { view: string }) {
	const views = useViews();

	return (
		<DesktopOnly>
			<IconButton type="button" onMouseDown={() => views.remove(props.view)}>
				<XIcon className="shrink-0 size-4" />
			</IconButton>
		</DesktopOnly>
	);
}
