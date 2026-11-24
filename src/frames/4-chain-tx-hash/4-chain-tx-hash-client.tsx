import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFromFetch } from "@tanstack/react-start/rsc";

import type { Chain } from "@/constants";
import { CloseFrameButton } from "@/frames/frame-context-provider";

export function TxHashClient(props: { chain: Chain; tx_hash: `0x${string}` }) {
	const query = useQuery({
		queryKey: [`/rsc/tx-hash?chain=${props.chain}&tx_hash=${props.tx_hash}`],
		queryFn: ({ queryKey }) => createFromFetch(fetch(queryKey.join())),
	});

	if (query.status === "pending") {
		return <TxHashFallback />;
	}

	return <Suspense fallback={<TxHashFallback />}>{query.data}</Suspense>;
}

function TxHashFallback() {
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
					<CloseFrameButton />
				</div>
			</div>

			<div className="flex items-center gap-12 text-sm text-gray-500">
				<div className="flex flex-col items-start gap-1">
					<p>Chain</p>
					<p>Status</p>
					<p>Timestamp</p>
					<p>Block #</p>
					<p>Tx Fee</p>
					<p>By</p>
					<p>Intent</p>
				</div>
			</div>
		</div>
	);
}

function Events() {
	return undefined;
}
