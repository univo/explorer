import { GitHubLogoWhite } from "@/components/icons";

export function Banner() {
	return (
		<aside
			aria-label="Explore our source code"
			className="relative hidden md:flex items-center justify-between gap-4 w-full rounded-md bg-white p-3 shadow-sm"
		>
			<p className="text-sm leading-relaxed text-gray-500">By using this site, you agree to check out its source code</p>

			<a
				href="https://github.com/univo/explorer"
				target="_blank"
				rel="noopener noreferrer"
				className="h-8 px-3 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#101411]"
			>
				<GitHubLogoWhite className="size-4" />
				<span className="text-white text-sm">GitHub</span>
			</a>
		</aside>
	);
}
