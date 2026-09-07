"use client";

import { useId } from "react";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";

export function AddressEventFilters(props: { address: `0x${string}` }) {
	const id = useId();

	return (
		<RadioGroup aria-labelledby={id} defaultValue="all" className="flex items-center gap-2">
			<label>
				<Radio.Root value="all" /> All
			</label>

			<label>
				<Radio.Root value="trades" /> Payments
			</label>

			<label>
				<Radio.Root value="trades" /> Trades
			</label>

			<label>
				<Radio.Root value="trades" /> Lending
			</label>
		</RadioGroup>
	);
}
