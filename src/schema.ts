import * as v from "valibot";
import { getAddress } from "viem";

export const ChainSchema = v.picklist([1, 42161, 8453]);

export const ChainStringSchema = v.pipe(v.string(), v.toNumber(), ChainSchema);

export const PresetSchema = v.pipe(
	v.string(), //
	v.picklist(["all", "payments", "trades", "lending"]),
);

export const AddressSchema = v.pipe(
	v.custom<string>((val) => typeof val === "string" && val.startsWith("0x") && val.length === 42),
	v.transform((address) => getAddress(address as `0x${string}`)),
);

export const BlockHashSchema = v.pipe(
	v.custom<string>((val) => typeof val === "string" && val.startsWith("0x") && val.length === 66),
	v.transform((tx) => tx as `0x${string}`),
);

export const TxHashSchema = v.pipe(
	v.custom<string>((val) => typeof val === "string" && val.startsWith("0x") && val.length === 66),
	v.transform((tx) => tx as `0x${string}`),
);

export const TxIndexSchema = v.pipe(
	v.string(), //
	v.toNumber(),
	v.integer(),
	v.minValue(0),
	v.maxValue(1_000_000_000),
);

export const BlockNumberSchema = v.pipe(
	v.string(), //
	v.toNumber(),
	v.integer(),
	v.minValue(0),
	v.maxValue(1_000_000_000),
);

export const ChainBlockNumberSchema = v.pipe(
	v.string(),
	v.regex(/^\d+-\d+$/),
	v.transform((frame) => frame.split("-")),
	v.strictTuple([ChainStringSchema, BlockNumberSchema]),
	v.transform(([chain, block]) => ({ chain, block })),
);

export const ChainTxPositionSchema = v.pipe(
	v.string(),
	v.regex(/^\d+-\d+-\d+$/),
	v.transform((frame) => frame.split("-")),
	v.strictTuple([ChainStringSchema, BlockNumberSchema, TxIndexSchema]),
	v.transform(([chain, block, tx]) => ({ chain, block, tx })),
);

export const ChainTxHashSchema = v.pipe(
	v.string(),
	v.transform((frame) => frame.split("-")),
	v.strictTuple([ChainStringSchema, TxHashSchema]),
	v.transform(([chain, tx_hash]) => ({ chain, tx_hash })),
);
