import { boolean, customType, pgTable } from "drizzle-orm/pg-core";

import { bytesToHex, hexToBytes } from "@/utils";

const id = customType<{ data: string; driverData: Uint8Array | string }>({
	dataType: () => "bytea",
	toDriver: (value) => hexToBytes(value),
	fromDriver: (value) => bytesToHex(value),
});

const hex = customType<{ data: `0x${string}`; driverData: Uint8Array | string }>({
	dataType: () => "bytea",
	toDriver: (value) => hexToBytes(value),
	fromDriver: (value) => `0x${bytesToHex(value)}` as const,
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
