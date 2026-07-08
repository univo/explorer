import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFromFetch } from "@tanstack/react-start/rsc";

import { CloseViewButton } from "@/components/views";

export function TransactionView(props: { block: number; tx: number }) {
	const query = useQuery({
		queryKey: ["tx", props.tx],
		queryFn: () => createFromFetch(fetch(`/rsc/TransactionView?block=${props.block}&tx=${props.tx}`)),
	});

	if (query.status === "pending") {
		return <TransactionViewFallback block={props.block} tx={props.tx} />;
	}

	return <Suspense fallback={<TransactionViewFallback block={props.block} tx={props.tx} />}>{query.data}</Suspense>;
}

function TransactionViewFallback(props: { block: number; tx: number }) {
	return (
		<div className="h-full flex flex-col bg-white">
			<Header block={props.block} tx={props.tx} />
			<Events />
		</div>
	);
}

function Header(props: { block: number; tx: number }) {
	return (
		<div className="border-b border-gray-200 bg-white p-3 flex flex-col gap-3">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2 overflow-hidden">
					<p className="text-gray-900 font-semibold text-base select-all">Transaction</p>
					{/* <p className="text-gray-500 text-base select-all truncate">{props.tx}</p> */}
				</div>

				<div className="flex items-center gap-2">
					{/* <IconButton href={`https://etherscan.io/tx/${props.tx}`}>
						<EtherscanIcon className="shrink-0 size-4" />
					</IconButton> */}

					<CloseViewButton view={`${props.block}-${props.tx}`} />
				</div>
			</div>

			<div className="flex items-center gap-12 text-sm text-gray-700">
				<div className="flex flex-col items-start gap-1">
					<p>Status</p>
					<p>Timestamp</p>
					<p>Block #</p>
					<p>Tx Index</p>
				</div>
			</div>
		</div>
	);
}

function Events() {
	return undefined;
}
