import { customType } from "drizzle-orm/pg-core";
import { sql, type SQL, type Column } from "drizzle-orm";

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

export { table as state_tokens_v1 } from "@/state/token";
export { table as state_accounts_v3 } from "@/state/account";

export { table as index_account_v3 } from "@/indexes/account-v3";
export { table as index_block_number_tx_index_v3 } from "@/indexes/block-number-tx-index-v3";

export { table as event_erc20_transfer_v3 } from "@/events/erc20-transfer-v3/event";
export { table as event_erc20_approval_v3 } from "@/events/erc20-approval-v3/event";
export { table as event_erc721_transfer_v3 } from "@/events/erc721-transfer-v3/event";
export { table as event_erc721_approval_v3 } from "@/events/erc721-approval-v3/event";
export { table as event_native_transfer_v3 } from "@/events/native-transfer-v3/event";
export { table as event_cancel_pending_tx_v3 } from "@/events/cancel-pending-tx-v3/event";
export { table as event_input_data_message_v3 } from "@/events/input-data-message-v3/event";
export { table as event_contract_deployment_v3 } from "@/events/contract-deployment-v3/event";
export { table as event_ens_name_registered_v3 } from "@/events/ens-name-registered-v3/event";
