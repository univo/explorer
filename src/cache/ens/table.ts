import { integer, pgTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const table = pgTable(
	"cache_ens",
	{
		chain: integer().notNull(),
		address: text().notNull(),
		ens: varchar({ length: 255 }), // Maximum length enforced by ENS
		created_at: timestamp({ precision: 3, mode: "date", withTimezone: true }).notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.chain, table.address],
		}),
	],
);
