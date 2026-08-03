import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("intent_aave_v3_borrow_v1", {
	id: id().primaryKey(),
	success: boolean().notNull(),
	quantity: hex().notNull(),
	referral_code: hex().notNull(),
	token_address: hex().notNull(),
	borrower_address: hex().notNull(),
	interest_rate_mode: hex().notNull(),
	on_behalf_of_address: hex().notNull(),
});
