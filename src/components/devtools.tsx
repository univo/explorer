import { TanStackDevtools } from "@tanstack/react-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

export function Devtools() {
	if (process.env.NODE_ENV === "development") {
		return (
			<TanStackDevtools
				config={{ position: "bottom-right" }}
				plugins={[{ name: "Tanstack Router", render: <TanStackRouterDevtoolsPanel /> }]}
			/>
		);
	}
}
