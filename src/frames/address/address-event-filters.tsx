"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { useFilterContext } from "./filter-context";

export function AddressEventFiltersSkeleton() {
	return (
		<div className="flex items-center gap-1 overflow-x-scroll px-3">
			<span className="bg-gray-100 py-px px-1.5 rounded-md text-sm text-gray-100">All</span>
			<span className="bg-gray-100 py-px px-1.5 rounded-md text-sm text-gray-100">Payments</span>
			<span className="bg-gray-100 py-px px-1.5 rounded-md text-sm text-gray-100">Trades</span>
			<span className="bg-gray-100 py-px px-1.5 rounded-md text-sm text-gray-100">Lending</span>
		</div>
	);
}

export function AddressEventFilters() {
	const id = useId();
	const filter = useFilterContext();

	return (
		<RadioGroup
			defaultValue="all"
			aria-labelledby={id}
			value={filter.value}
			onValueChange={filter.setValue}
			style={{ scrollbarWidth: "none" }}
			className="flex items-center gap-1 overflow-x-scroll px-3"
		>
			<RadioButton value="all">All</RadioButton>
			<RadioButton value="payments">Payments</RadioButton>
			<RadioButton value="trades">Trades</RadioButton>
			<RadioButton value="lending">Lending</RadioButton>
		</RadioGroup>
	);
}

function RadioButton(props: { value: string; children: ReactNode }) {
	return (
		<Radio.Root
			value={props.value}
			className="hover:bg-gray-100 py-px px-1.5 rounded-md text-sm cursor-pointer data-checked:bg-primary-500 data-checked:text-white"
		>
			<label className="cursor-pointer">{props.children}</label>
		</Radio.Root>
	);
}
