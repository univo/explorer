import { create } from "zustand";
import { useEffect } from "react";
import { Dialog as Radix } from "radix-ui";
import { ClientOnly } from "@tanstack/react-router";

import { Search } from "./search";
import { isMobile } from "@/helpers";

export function SearchDialog() {
	return (
		<ClientOnly fallback={null}>
			<Dialog />
		</ClientOnly>
	);
}

export const useSearchOpen = create(() => false);

export const setSearchOpen = (open: boolean) => useSearchOpen.setState(open);
export const toggleSearchOpen = () => useSearchOpen.setState((open) => !open);

function Dialog() {
	const open = useSearchOpen();

	// Toggle the menu when / or ⌘K is pressed
	useSearchKeyListener();

	if (isMobile()) {
		return (
			<Radix.Root open={open} onOpenChange={setSearchOpen}>
				<Radix.Portal>
					<div className="fixed inset-0">
						<Search onClose={() => setSearchOpen(false)} />
					</div>
				</Radix.Portal>
			</Radix.Root>
		);
	}

	return (
		<Radix.Root open={open} onOpenChange={setSearchOpen}>
			<Radix.Portal>
				<Radix.Overlay className="fixed inset-0 bg-gray-200/75">
					<div className="h-full md:px-4 md:pt-4 md:pb-4 overflow-y-auto">
						<div className="flex justify-center min-h-full items-end md:items-center">
							<Radix.Content className="w-3xl sm:my-8">
								<div className="hidden">
									<Radix.Title>Search</Radix.Title>
									<Radix.Description>Search</Radix.Description>
								</div>

								<Search onClose={() => setSearchOpen(false)} />
							</Radix.Content>
						</div>
					</div>
				</Radix.Overlay>
			</Radix.Portal>
		</Radix.Root>
	);
}

function useSearchKeyListener() {
	useEffect(() => {
		const down = (event: KeyboardEvent) => {
			if (event.key === "/") {
				event.preventDefault();
				toggleSearchOpen();
			}

			if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				toggleSearchOpen();
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	});
}
