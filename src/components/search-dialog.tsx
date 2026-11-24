"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
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
			<BaseDialog.Root open={open} onOpenChange={setSearchOpen}>
				<BaseDialog.Portal>
					<BaseDialog.Popup className="fixed inset-0 overflow-y-auto outline-hidden">
						<BaseDialog.Title className="sr-only">Search</BaseDialog.Title>
						<BaseDialog.Description className="sr-only">Search tokens, transactions, and accounts.</BaseDialog.Description>
						<Search onClose={() => setSearchOpen(false)} />
					</BaseDialog.Popup>
				</BaseDialog.Portal>
			</BaseDialog.Root>
		);
	}

	return (
		<BaseDialog.Root open={open} onOpenChange={setSearchOpen}>
			<BaseDialog.Portal>
				<BaseDialog.Backdrop className="fixed inset-0 bg-gray-200/75" />
				<BaseDialog.Viewport className="fixed inset-0 md:px-4 md:pt-4 md:pb-4 overflow-y-auto">
					<div className="flex justify-center min-h-full items-end md:items-center">
						<BaseDialog.Popup className="w-3xl sm:my-8 outline-hidden">
							<BaseDialog.Title className="sr-only">Search</BaseDialog.Title>
							<BaseDialog.Description className="sr-only">Search tokens, transactions, and accounts.</BaseDialog.Description>

							<Search onClose={() => setSearchOpen(false)} />
						</BaseDialog.Popup>
					</div>
				</BaseDialog.Viewport>
			</BaseDialog.Portal>
		</BaseDialog.Root>
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
