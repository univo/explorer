import { sql, type Column, type SQL } from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";

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

export const id = customType<{ data: string; driverData: Uint8Array | string }>({
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
		if (value instanceof Uint8Array) {
			let output = "";

			for (const byte of value as unknown as Uint8Array) {
				const hex = byte.toString(16);
				output += hex.length === 1 ? `0${hex}` : hex;
			}

			return output;
		}

		throw new Error(`Failed to parse bytea value: ${value}`);
	},
});

export const hex = customType<{ data: `0x${string}` }>({
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
		if (value instanceof Uint8Array) {
			let output = "";

			for (const byte of value as unknown as Uint8Array) {
				const hex = byte.toString(16);
				output += hex.length === 1 ? `0${hex}` : hex;
			}

			return `0x${output}`;
		}

		throw new Error(`Failed to parse bytea value: ${value}`);
	},
});
