import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFromFetch } from "@tanstack/react-start/rsc";

import { CloseViewButton } from "@/components/views";

export function TxViewClient(props: { block: number; tx: number }) {
	const query = useQuery({
		queryKey: [`/rsc/tx-view?block=${props.block}&tx=${props.tx}`],
		queryFn: () => createFromFetch(fetch(`/rsc/tx-view?block=${props.block}&tx=${props.tx}`)),
	});

	if (query.status === "pending") {
		return <TxViewFallback />;
	}

	return <Suspense fallback={<TxViewFallback />}>{query.data}</Suspense>;
}

function TxViewFallback() {
	return (
		<div className="h-full flex flex-col bg-white">
			<Header />
			<Events />
		</div>
	);
}

function Header() {
	return (
		<div className="bg-white p-3 flex flex-col gap-3">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2 overflow-hidden">
					<p className="text-gray-900 font-semibold text-base select-all">Transaction</p>
				</div>

				<div className="flex items-center gap-2">
					<CloseViewButton />
				</div>
			</div>

			<div className="flex items-center gap-12 text-sm text-gray-700">
				<div className="flex flex-col items-start gap-1">
					<p>Status</p>
					<p>Timestamp</p>
					<p>Block #</p>
					<p>Tx Index</p>
					<p>Action</p>
				</div>
			</div>
		</div>
	);
}

function Events() {
	return undefined;
}
