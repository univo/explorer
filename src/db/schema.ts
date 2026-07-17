import { sql, type SQL, type Column } from "drizzle-orm";
import { bigint, boolean, customType, integer, pgTable, primaryKey, smallint } from "drizzle-orm/pg-core";

import { bytesToHex, hexToBytes } from "@/utils";

export function inTuple(columns: Column[], values: any[][]): SQL<unknown> {
	// Prevent SQL errors if the array of values is completely empty
	if (values.length === 0) {
		return sql`FALSE`;
	}

	// Map out the columns chunk: (col1, col2, ...)
	const columnsPart = sql`(${sql.join(columns, sql`, `)})`;

	// Map out the values chunk: ((v1, v2), (v3, v4), ...)
	const valuesPart = sql.join(
		values.map((val) => sql`(${sql.join(val, sql`, `)})`),
		sql`, `,
	);

	// Return the compiled raw SQL expression
	return sql`${columnsPart} IN (${valuesPart})`;
}

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

const event_cancel_pending_tx_v3 = pgTable("event_cancel_pending_tx_v3", {
	id: id().primaryKey(),
	success: boolean().notNull(),
	from_address: hex().notNull(),
	nonce: bigint({ mode: "number" }).notNull(),
});

const index_account_v3 = pgTable(
	"index_account_v3",
	{
		account: hex().notNull(),
		event_id: id().notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.account, table.event_id],
		}),
	],
);

const index_block_number_tx_index_v3 = pgTable(
	"index_block_number_tx_index_v3",
	{
		chain: smallint().notNull(),
		block_number: integer().notNull(),
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		table_id: smallint().notNull(),
		block_timestamp: integer().notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.chain, table.block_number, table.tx_index, table.log_index],
		}),
	],
);

export const schema = {
	event_erc20_transfer_v3,
	event_cancel_pending_tx_v3,
	index_account_v3,
	index_block_number_tx_index_v3,
};
