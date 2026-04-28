import clsx from "clsx";
import { ClientOnly, useRouterState } from "@tanstack/react-router";

export function GlobalLoading() {
	return (
		<ClientOnly fallback={null}>
			<Indicator />
		</ClientOnly>
	);
}

function Indicator() {
	const active = useRouterState({ select: (router) => router.status === "pending" });

	return (
		<div
			className={clsx(
				active ? "visible" : "hidden",
				"bg-blue-500/40 shadow-blue-500/40 fixed inset-x-0 top-0 h-[2px] shadow-xs pointer-events-none z-[999]",
			)}
		>
			<div className="bg-blue-500 h-full w-4/5"></div>
		</div>
	);
}
