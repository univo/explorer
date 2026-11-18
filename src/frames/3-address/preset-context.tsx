"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

import { raise } from "@/utils";
import type { Preset } from "@/constants";

type PresetContext = {
	value: Preset;
	setValue: (preset: Preset) => void;
};

const PresetContext = createContext<PresetContext | null>(null);

export const usePresetContext = () => useContext(PresetContext) ?? raise("Missing PresetContext");

export function PresetContextProvider(props: { children: ReactNode }) {
	const [value, setValue] = useState<Preset>("all");

	return <PresetContext value={{ value, setValue }}>{props.children}</PresetContext>;
}
