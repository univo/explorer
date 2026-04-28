import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";

import css from "@/styles/tailwind.css?url";
import { Devtools } from "@/components/devtools";
import { Navigation } from "@/components/navigation";
import { SearchDialog } from "@/components/search-dialog";
import { GlobalLoading } from "@/components/global-loading";

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
				<Navigation />
				<SearchDialog />
				<GlobalLoading />
				<Outlet />
				<Devtools />
				<Scripts />
			</body>
		</html>
	);
}

function NotFound() {
	return <p>Not found</p>;
}

function ErrorComponent() {
	return <p>Error component</p>;
}
