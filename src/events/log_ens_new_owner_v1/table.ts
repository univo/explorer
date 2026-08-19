import { index, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable(
	"log_ens_new_owner_v1",
	{
		id: id().primaryKey(),
		label: hex().notNull(),
		owner_address: hex().notNull(),
	},
	(table) => [
		// Allows eligibility checks to find reverse records by the label derived from an account address
		index("log_ens_new_owner_v1_label_idx").on(table.label),
	],
);
