import * as v from "valibot";
import { getAddress } from "viem";

import { parseId } from "./helpers";

export const AddressSchema = v.pipe(
	v.custom<string>((val) => typeof val === "string" && val.startsWith("0x") && val.length === 42),
	v.transform((address) => getAddress(address as `0x${string}`)),
);

export const TxHashSchema = v.pipe(
	v.custom<string>((val) => typeof val === "string" && val.startsWith("0x") && val.length === 66),
	v.transform((tx) => tx as `0x${string}`),
);

export const TxPositionSchema = v.pipe(
	v.custom<string>((val) => {
		if (typeof val !== "string") return false;

		const parts = val.split("-");
		if (parts.length !== 2) return false;

		const [block, tx] = parts;
		if (block === "" || tx === "") return false;

		const blockNumber = Number(block);
		const txIndex = Number(tx);

		return (
			Number.isInteger(blockNumber) &&
			blockNumber >= 0 &&
			blockNumber <= 1_000_000_000 &&
			Number.isInteger(txIndex) &&
			txIndex >= 0
		);
	}),
	v.transform((position) => {
		const [block, tx] = position.split("-");
		return { block: Number(block), tx: Number(tx) };
	}),
);

export const TxIndexSchema = v.pipe(v.string(), v.toNumber(), v.integer(), v.minValue(0), v.maxValue(1_000_000_000));

export const BlockNumberSchema = v.pipe(
	v.string(),
	v.toNumber(),
	v.integer(),
	v.minValue(0),
	v.maxValue(1_000_000_000),
);

export const EventSchema = v.custom<string>((val) => {
	try {
		if (typeof val !== "string") return false;
		parseId(val);
		return true;
	} catch {
		return false;
	}
});
