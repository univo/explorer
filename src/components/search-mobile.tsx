import { SearchIcon } from "./icons";
import { setSearchOpen } from "@/hooks/use-search-open";

export function SearchMobile() {
	return (
		<button
			type="button"
			onClick={() => setSearchOpen(true)}
			className="bg-white w-full rounded-md shadow-sm ring-1 ring-black/5 overflow-hidden relative flex items-center"
		>
			<SearchIcon className="shrink-0 absolute text-gray-400 size-4 start-4" />

			<div className="flex items-center w-full bg-transparent border-0 h-10 px-4 ps-11 pe-10">
				<p className="text-sm text-gray-400">Search tokens, transactions, accounts...</p>
			</div>
		</button>
	);
}
