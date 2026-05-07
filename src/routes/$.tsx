import { createFileRoute } from "@tanstack/react-router";

import { Kbd } from "@/components/kbd";
import { SearchIcon } from "@/components/icons";
import { OpenSearchButton } from "@/components/open-search-button";
import { useViews, View, ViewContainer, ViewsContainer } from "@/components/views";

export const Route = createFileRoute("/$")({
	component: Component,
	errorComponent: ErrorComponent,
});

function Component() {
	const views = useViews();

	if (views.value.length === 0) {
		return (
			<ViewsContainer>
				<ViewContainer>
					<IndexView />
				</ViewContainer>
			</ViewsContainer>
		);
	}

	return (
		<ViewsContainer>
			{views.value.map((view, index) => {
				return (
					<ViewContainer key={view}>
						<View view={view} index={index} />
					</ViewContainer>
				);
			})}
		</ViewsContainer>
	);
}

function IndexView() {
	return (
		<div className="relative h-full">
			<div
				style={{ backgroundSize: "32px", backgroundPosition: "16px 0px" }}
				className="absolute inset-x-0 bottom-0 -top-px bg-[url('/img/grid.svg')]"
			/>

			<div className="absolute inset-0 bg-linear-to-b from-white" />

			<div className="relative w-full h-full flex flex-col justify-between">
				<div className="px-4">
					<div className="mt-40 h-7 px-3 inline-flex items-center gap-1.5 rounded-full bg-white shadow-sm ring-1 ring-black/5">
						<img
							alt="Ethereum logo"
							className="rounded-full overflow-hidden size-4"
							src="https://etherscan.io/token/images/ether.png"
						/>

						<span className="text-gray-900 text-sm">Ethereum</span>
					</div>

					<h1 className="mt-6 text-3xl font-semibold text-gray-900">
						explorer.<span className="text-primary-500">univo</span>.app
					</h1>

					<h2 className="mt-2 text-xl text-gray-500">
						Explore billions of <span className="hidden md:inline-block">public</span> blockchain events
					</h2>

					<OpenSearchButton
						type="button"
						className="mt-[27px] relative w-full cursor-pointer flex items-center justify-between bg-white rounded-lg ring-1 ring-black/5 shadow-sm h-10 px-4"
					>
						<div className="flex items-center gap-4">
							<SearchIcon className="shrink-0 text-gray-500 size-4" />

							<p className="text-sm text-gray-500">
								<span className="hidden md:block">
									Press <Kbd>/</Kbd> to search tokens, transactions, accounts...
								</span>

								<span className="md:hidden">Search tokens, transactions, accounts...</span>
							</p>
						</div>
					</OpenSearchButton>

					<div className="flex gap-2">
						<a
							target="_blank"
							rel="noopener noreferrer"
							href="https://github.com/univo/explorer"
							className="mt-8 h-8 px-3 inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-150 text-gray-900 text-sm"
						>
							GitHub
						</a>

						<a
							target="_blank"
							rel="noopener noreferrer"
							href="https://x.com/univo_app"
							className="mt-8 h-8 px-3 inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-150 text-gray-900 text-sm"
						>
							Twitter
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}

function ErrorComponent() {
	return undefined;
}
