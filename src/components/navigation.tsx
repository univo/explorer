import clsx from "clsx";
import { Link } from "@tanstack/react-router";

import { Logo } from "./logo";
import { SearchIcon } from "./icons";
import { Container } from "./container";
import { setSearchOpen, useSearchOpen } from "./search-dialog";

export function Navigation() {
	const open = useSearchOpen();

	return (
		<nav className="w-full bg-white border-b border-gray-200">
			<Container>
				<div className="h-(--header-height) flex items-center">
					<div className="grid grid-cols-12 gap-4 w-full">
						<div className="flex items-center col-span-4">
							<Link to="/$">
								<Logo className="w-auto h-6" />
							</Link>
						</div>

						<div className="col-span-8 flex items-center justify-end">
							<button
								type="button"
								onMouseDown={() => setSearchOpen(true)}
								className={clsx(
									open && "bg-gray-100",
									"hover:text-gray-500 hover:bg-gray-100",
									"cursor-pointer rounded-full -mx-2.5 px-2.5 py-1 flex items-center space-x-2 text-sm text-gray-400",
								)}
							>
								<SearchIcon className="size-3.5" />
								<span>Search</span>
							</button>
						</div>
					</div>
				</div>
			</Container>
		</nav>
	);
}
