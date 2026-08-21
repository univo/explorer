import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("intent_erc721_approval_v1", {
	id: id().primaryKey(),
	approved: boolean().notNull(),
	token_id: hex(), // Nullable so that we can differentiate `approve` from `setApprovalForAll`
	success: boolean().notNull(),
	caller_address: hex().notNull(),
	spender_address: hex().notNull(),
	token_address: hex().notNull(),
});
