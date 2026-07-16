import { boolean, customType, pgTable } from "drizzle-orm/pg-core";

import { bytesToHex, hexToBytes } from "@/utils";

const id = customType<{ data: string; driverData: Uint8Array | string }>({
	dataType: () => "bytea",
	toDriver: (value) => hexToBytes(value),
	fromDriver: (value) => bytesToHex(value),
});

const hex = customType<{ data: `0x${string}` }>({
	dataType() {
		return "bytea";
	},
	toDriver(value) {
		let str = value as string;

		if (str.startsWith("0x")) {
			str = str.slice(2);
		}

		if (str.length % 2 !== 0) {
			str = `0${str}`;
		}

		const pairs = str.match(/[\da-f]{2}/gi);

		if (pairs === null) {
			throw new Error(`Expected pairs to be defined for value: ${str}`);
		}

		return new Uint8Array(pairs.map((byte) => Number.parseInt(byte, 16)));
	},
	fromDriver(value) {
		let output = "";

		for (const byte of value as unknown as Uint8Array) {
			const hex = byte.toString(16);
			output += hex.length === 1 ? `0${hex}` : hex;
		}

		return `0x${output}`;
	},
});

const event_erc20_transfer_v3 = pgTable("event_erc20_transfer_v3", {
	id: id().primaryKey(),
	success: boolean().notNull(),
	quantity: hex().notNull(),
	to_address: hex().notNull(),
	from_address: hex().notNull(),
	token_address: hex().notNull(),
});

export const schema = {
	event_erc20_transfer_v3,
};
