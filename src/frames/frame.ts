import * as v from "valibot";

import type { Chain } from "@/constants";
import { AddressSchema, ChainBlockNumberSchema, ChainTxHashSchema, ChainTxPositionSchema } from "@/schema";

export type Frame =
	| { type: "address"; data: `0x${string}`; raw: string }
	| { type: "chain-block-number"; data: { chain: Chain; block: number }; raw: string }
	| { type: "chain-tx-hash"; data: { chain: Chain; tx_hash: `0x${string}` }; raw: string }
	| { type: "chain-tx-position"; data: { chain: Chain; block: number; tx: number }; raw: string };

type FrameInput =
	| { type: "address"; data: `0x${string}` }
	| { type: "chain-block-number"; data: { chain: number; block: number } }
	| { type: "chain-tx-hash"; data: { chain: number; tx_hash: `0x${string}` } }
	| { type: "chain-tx-position"; data: { chain: number; block: number; tx: number } };

export const frame = {
	format(input: FrameInput): string {
		switch (input.type) {
			case "chain-tx-position":
				return `1-${input.data.chain}-${input.data.block}-${input.data.tx}`;
			case "chain-block-number":
				return `2-${input.data.chain}-${input.data.block}`;
			case "address":
				return `3-${input.data}`;
			case "chain-tx-hash":
				return `4-${input.data.chain}-${input.data.tx_hash}`;
		}
	},
};

export function getFrame(frame: string): Frame | null {
	const separator = frame.indexOf("-");

	if (separator === -1) {
		return null;
	}

	const id = frame.slice(0, separator);
	const payload = frame.slice(separator + 1);

	switch (id) {
		case "1": {
			const result = v.safeParse(ChainTxPositionSchema, payload);
			return result.success ? { type: "chain-tx-position", data: result.output, raw: frame } : null;
		}
		case "2": {
			const result = v.safeParse(ChainBlockNumberSchema, payload);
			return result.success ? { type: "chain-block-number", data: result.output, raw: frame } : null;
		}
		case "3": {
			const result = v.safeParse(AddressSchema, payload);
			return result.success ? { type: "address", data: result.output, raw: frame } : null;
		}
		case "4": {
			const result = v.safeParse(ChainTxHashSchema, payload);
			return result.success ? { type: "chain-tx-hash", data: result.output, raw: frame } : null;
		}
		default: {
			return null;
		}
	}
}
