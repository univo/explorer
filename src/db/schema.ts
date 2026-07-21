import { sql, type SQL, type Column } from "drizzle-orm";
import { boolean, customType, integer, pgTable, primaryKey, smallint, text } from "drizzle-orm/pg-core";

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

const event_erc20_transfer_v3 = pgTable("event_erc20_transfer_v3", {
	id: id().primaryKey(),
	quantity: hex().notNull(),
	to_address: hex().notNull(),
	success: boolean().notNull(),
	from_address: hex().notNull(),
	token_address: hex().notNull(),
});

const event_erc20_approval_v3 = pgTable("event_erc20_approval_v3", {
	id: id().primaryKey(),
	quantity: hex().notNull(),
	success: boolean().notNull(),
	owner_address: hex().notNull(),
	spender_address: hex().notNull(),
	token_address: hex().notNull(),
});

const event_native_transfer_v3 = pgTable("event_native_transfer_v3", {
	id: id().primaryKey(),
	quantity: hex().notNull(),
	to_address: hex().notNull(),
	success: boolean().notNull(),
	from_address: hex().notNull(),
});

const event_erc721_transfer_v3 = pgTable("event_erc721_transfer_v3", {
	id: id().primaryKey(),
	token_id: hex().notNull(),
	to_address: hex().notNull(),
	success: boolean().notNull(),
	from_address: hex().notNull(),
	token_address: hex().notNull(),
});

const event_erc721_approval_v3 = pgTable("event_erc721_approval_v3", {
	id: id().primaryKey(),
	token_id: hex().notNull(),
	success: boolean().notNull(),
	owner_address: hex().notNull(),
	spender_address: hex().notNull(),
	token_address: hex().notNull(),
});

const event_cancel_pending_tx_v3 = pgTable("event_cancel_pending_tx_v3", {
	id: id().primaryKey(),
	nonce: hex().notNull(),
	success: boolean().notNull(),
	from_address: hex().notNull(),
});

const event_input_data_message_v3 = pgTable("event_input_data_message_v3", {
	id: id().primaryKey(),
	message: text().notNull(),
	success: boolean().notNull(),
	to_address: hex().notNull(),
	from_address: hex().notNull(),
});

const event_contract_deployment_v3 = pgTable("event_contract_deployment_v3", {
	id: id().primaryKey(),
	success: boolean().notNull(),
	contract_address: hex().notNull(),
	deployer_address: hex().notNull(),
});

const event_ens_name_registered_v3 = pgTable("event_ens_name_registered_v3", {
	id: id().primaryKey(),
	name: text().notNull(),
	cost_eth: hex().notNull(),
	expires_at: hex().notNull(),
	success: boolean().notNull(),
	owner_address: hex().notNull(),
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
		tx_index: smallint().notNull(),
		log_index: integer().notNull(),
		table_id: smallint().notNull(),
		block_number: integer().notNull(),
		block_timestamp: integer().notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.chain, table.block_number, table.tx_index, table.log_index],
		}),
	],
);

const state_tokens_v1 = pgTable(
	"state_tokens_v1",
	{
		name: text(),
		image: text(),
		symbol: text(),
		decimals: smallint(),
		address: text().notNull(),
		chain: integer().notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.chain, table.address],
		}),
	],
);

const state_accounts_v3 = pgTable(
	"state_accounts_v3",
	{
		chain: integer().notNull(),
		address: text().notNull(),
		is_contract: boolean(),
		owner_project: text(),
		contract_name: text(),
		code_compiler: text(),
		code_language: text(),
		deployment_tx: text(),
		deployer_block: text(),
		usage_category: text(),
		deployer_address: text(),
		source_code_verified: text(),
		erc_type: text(),
		"erc20.name": text("erc20.name"),
		"erc20.symbol": text("erc20.symbol"),
		"erc20.decimals": text("erc20.decimals"),
	},
	(table) => [
		primaryKey({
			columns: [table.chain, table.address],
		}),
	],
);

export const schema = {
	event_erc20_transfer_v3,
	event_erc20_approval_v3,
	event_native_transfer_v3,
	event_erc721_transfer_v3,
	event_erc721_approval_v3,
	event_cancel_pending_tx_v3,
	event_input_data_message_v3,
	event_contract_deployment_v3,
	event_ens_name_registered_v3,
	index_account_v3,
	index_block_number_tx_index_v3,
	state_tokens_v1,
	state_accounts_v3,
};
