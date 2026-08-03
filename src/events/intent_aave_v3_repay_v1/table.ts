import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("intent_aave_v3_repay_v1", {
	id: id().primaryKey(),
	quantity: hex().notNull(),
	success: boolean().notNull(),
	token_address: hex().notNull(),
	use_atokens: boolean().notNull(),
	repayer_address: hex().notNull(),
	interest_rate_mode: hex().notNull(),
	on_behalf_of_address: hex().notNull(),
});
