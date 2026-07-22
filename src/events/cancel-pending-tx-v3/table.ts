import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("event_cancel_pending_tx_v3", {
	id: id().primaryKey(),
	nonce: hex().notNull(),
	success: boolean().notNull(),
	from_address: hex().notNull(),
});
