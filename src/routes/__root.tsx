import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";

import { Logo } from "@/components/logo";
import css from "@/styles/tailwind.css?url";
import { Devtools } from "@/components/devtools";
import { Navigation } from "@/components/navigation";
import { SearchDialog } from "@/components/search-dialog";
import { GlobalLoading } from "@/components/global-loading";
import { FrameContextProvider } from "@/frames/frame-context-provider";
import { QueryClientProvider } from "@/components/query-client-provider";
import { MAINTENANCE_MODE } from "@/constants";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ title: "univo" },
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
			{ property: "og:title", content: "univo" },
			{ property: "og:type", content: "website" },
			{ property: "og:description", content: "univo" },
			{ property: "og:url", content: "https://explorer.univo.app" },
			{ property: "og:image", content: "https://explorer.univo.app/opengraph.png" },
		],
		links: [{ rel: "stylesheet", href: css }],
	}),
	ssr: false,
	shellComponent: Root,
	notFoundComponent: NotFound,
	errorComponent: ErrorComponent,
});

function Root() {
	return (
		<html lang="en" className="overscroll-y-none bg-white">
			<head>
				<HeadContent />
			</head>

			<body className="bg-gray-50 h-svh flex flex-col">
				<QueryClientProvider>
					<FrameContextProvider>
						<Navigation />
						<SearchDialog />
						<GlobalLoading />

						{MAINTENANCE_MODE ? <Maintenance /> : <Outlet />}

						<Devtools />
						<Scripts />
					</FrameContextProvider>
				</QueryClientProvider>
			</body>
		</html>
	);
}

function Maintenance() {
	return (
		<div className="w-full h-full flex items-center justify-center">
			<div className="flex flex-col items-center">
				<Logo className="size-8" />
				<p className="text-gray-900 font-medium text-lg mt-8">univo is under maintenance</p>
				<p className="text-gray-500 text-sm mt-0.5">Your favourite block explorer will be back later</p>
			</div>
		</div>
	);
}

function NotFound() {
	return <p>Not found</p>;
}

function ErrorComponent() {
	return <p>Error component</p>;
}
