import { createContext, useContext } from "react";

import { raise } from "@/utils";

type FrameContextValue = {
	value: string[];
	clear(): Promise<void>;
	remove(index: number | null): Promise<void>;
	push(frame: string, index: number | null): Promise<void>;
};

export const FrameContext = createContext<FrameContextValue | null>(null);

export function useFrames() {
	return useContext(FrameContext) ?? raise("Missing FrameContextProvider");
}

export const FrameIndexContext = createContext<number | null>(null);

export function useFrameIndex() {
	return useContext(FrameIndexContext);
}
