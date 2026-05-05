import * as v from "valibot";
import { getAddress } from "viem";

export const AddressSchema = v.pipe(
	v.custom<string>((val) => typeof val === "string" && val.startsWith("0x") && val.length === 42),
	v.transform((address) => getAddress(address as `0x${string}`)),
);

export const TransactionSchema = v.pipe(
	v.custom<string>((val) => typeof val === "string" && val.startsWith("0x") && val.length === 66),
	v.transform((tx) => tx as `0x${string}`),
);

export const BlockNumberSchema = v.pipe(
	v.string(),
	v.toNumber(),
	v.integer(),
	v.minValue(0),
	v.maxValue(1_000_000_000),
);
