"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

import { raise } from "@/utils";

export type Filter = "all" | "payments" | "trades" | "lending";

type FilterContext = {
	value: Filter;
	setValue: (filter: Filter) => void;
};

const FilterContext = createContext<FilterContext | null>(null);

export const useFilterContext = () => useContext(FilterContext) ?? raise("Missing FilterContext");

export function FilterContextProvider(props: { children: ReactNode }) {
	const [value, setValue] = useState<Filter>("all");

	return <FilterContext value={{ value, setValue }}>{props.children}</FilterContext>;
}
