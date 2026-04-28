import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: 0,
				structuralSharing: false, // Prevents merging RSC payloads
				staleTime: Number.POSITIVE_INFINITY,
			},
		},
	});

	const router = createRouter({
		routeTree,
		defaultPreload: false,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
	});

	setupRouterSsrQueryIntegration({ router, queryClient });

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
