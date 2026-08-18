import { index, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable(
	"log_ens_reverse_claimed_v1",
	{
		id: id().primaryKey(),
		node: hex().notNull(),
		account_address: hex().notNull(),
	},
	(table) => [
		// Allows us to search if an account may have registered an ENS name
		index("log_ens_reverse_claimed_v1_account_address_idx").on(table.account_address),
	],
);
