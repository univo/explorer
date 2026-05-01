"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider as Provider } from "@tanstack/react-query";

const client = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 0,
			structuralSharing: false, // Prevents merging RSC payloads
			staleTime: Number.POSITIVE_INFINITY,
		},
	},
});

export function QueryClientProvider(props: { children: ReactNode }) {
	return <Provider client={client}>{props.children}</Provider>;
}
