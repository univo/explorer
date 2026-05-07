import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFromFetch } from "@tanstack/react-start/rsc";

import { formatNumber } from "@/utils";
import { Spinner } from "@/components/spinner";
import { EtherscanIcon } from "@/components/icons";
import { CloseViewButton } from "@/components/views";
import { IconButton } from "@/components/icon-button";

export function BlockNumberView(props: { number: number }) {
	const query = useQuery({
		queryKey: ["block-number", props.number],
		queryFn: () => createFromFetch(fetch(`/rsc/BlockNumberView?number=${props.number}`)),
	});

	if (query.status === "pending") {
		return <BlockNumberViewFallback number={props.number} />;
	}

	return <Suspense fallback={<BlockNumberViewFallback number={props.number} />}>{query.data}</Suspense>;
}

function BlockNumberViewFallback(props: { number: number }) {
	return (
		<div className="h-full flex flex-col bg-white">
			<Header number={props.number} />
			<Events />
		</div>
	);
}

function Header(props: { number: number }) {
	return (
		<div className="border-b border-gray-200 bg-white px-3 py-3 flex items-center justify-between">
			<div className="flex items-center gap-2 overflow-hidden">
				<p className="text-gray-900 font-semibold text-base select-all">Block</p>
				<p className="text-gray-500 text-base select-all truncate">{formatNumber(props.number)}</p>
			</div>

			<div className="flex items-center gap-2">
				<IconButton href={`https://etherscan.io/block/${props.number}`}>
					<EtherscanIcon className="shrink-0 size-4" />
				</IconButton>

				<CloseViewButton view={String(props.number)} />
			</div>
		</div>
	);
}

function Events() {
	return (
		<div>
			<LoadingIndicator />
		</div>
	);
}

function LoadingIndicator() {
	return (
		<div className="flex justify-center items-center h-16 not-first:border-t not-first:border-gray-200">
			<Spinner className="size-4" />
		</div>
	);
}
