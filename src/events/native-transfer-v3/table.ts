import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("event_native_transfer_v3", {
	id: id().primaryKey(),
	quantity: hex().notNull(),
	to_address: hex().notNull(),
	success: boolean().notNull(),
	from_address: hex().notNull(),
});
