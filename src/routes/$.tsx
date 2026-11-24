import { createFileRoute } from "@tanstack/react-router";

import { Kbd } from "@/components/kbd";
import { Banner } from "@/components/banner";
import { ArbitrumLogo, SearchIcon, TwitterLogoWhite } from "@/components/icons";
import { useFrames } from "@/frames/frame-context";
import { OpenSearchButton } from "@/components/open-search-button";
import { Frame, FrameContainer, FramesContainer } from "@/frames/frame-context-provider";

export const Route = createFileRoute("/$")({
	component: Component,
	errorComponent: ErrorComponent,
});

function Component() {
	const frames = useFrames();

	if (frames.value.length === 0) {
		return (
			<FramesContainer>
				<FrameContainer>
					<IndexFrame />
				</FrameContainer>
			</FramesContainer>
		);
	}

	return (
		<FramesContainer>
			{frames.value.map((frame, index) => {
				return (
					<FrameContainer key={frame}>
						<Frame frame={frame} index={index} />
					</FrameContainer>
				);
			})}
		</FramesContainer>
	);
}

function IndexFrame() {
	return (
		<div className="relative h-full">
			<div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -top-px overflow-hidden">
				<img alt="" src="/img/home-grid.svg" width={768} height={1024} className="absolute inset-0 size-full" />
				<img
					alt=""
					src="/img/grid-trails.svg"
					width={768}
					height={1024}
					className="absolute left-0 top-0 h-[1024px] w-[768px] max-w-none motion-reduce:hidden"
				/>
			</div>

			<div className="absolute inset-0 bg-linear-to-b from-white" />

			<div className="relative w-full h-full flex flex-col justify-between">
				<div className="px-4">
					<div className="mt-40 flex gap-2.5">
						<a
							target="_blank"
							rel="noopener noreferrer"
							href="https://x.com/univo_app"
							className="h-8 px-3 inline-flex items-center gap-1.5 rounded-full bg-black"
						>
							<TwitterLogoWhite className="size-4" />

							<span className="text-white text-sm">Twitter</span>
						</a>
					</div>

					<h1 className="mt-[34px] text-3xl font-semibold text-gray-900">
						explorer.<span className="text-primary-500">univo</span>.app
					</h1>

					<h2 className="mt-[4px] text-xl text-gray-500">
						Explore billions of <span className="hidden md:inline-block">public</span> blockchain events
					</h2>

					<OpenSearchButton
						type="button"
						className="mt-[34px] h-[47px] relative w-[calc(100%+1px)] cursor-pointer flex items-center justify-between bg-white rounded-lg ring-1 ring-black/5 shadow-sm px-4"
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

					<div className="mt-[40px] flex gap-2.5">
						<div className="h-8 px-3 inline-flex items-center gap-1.5 rounded-full bg-white shadow-sm">
							<img alt="Ethereum logo" className="rounded-full overflow-hidden size-4" src="https://etherscan.io/token/images/ether.png" />

							<span className="text-gray-500 text-sm">Ethereum</span>
						</div>

						<div className="h-8 px-3 inline-flex items-center gap-1.5 rounded-full bg-white shadow-sm">
							<ArbitrumLogo className="size-4" />

							<span className="text-gray-500 text-sm">Arbitrum</span>
						</div>
					</div>
				</div>

				<div className="mt-auto px-4 pb-4 pt-10">
					<Banner />
				</div>
			</div>
		</div>
	);
}

function ErrorComponent() {
	return undefined;
}
