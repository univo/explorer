import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("intent_cancel_pending_tx_v1", {
	id: id().primaryKey(),
	nonce: hex().notNull(),
	success: boolean().notNull(),
	from_address: hex().notNull(),
});
