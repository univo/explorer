import { boolean, pgTable, text } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("event_input_data_message_v3", {
	id: id().primaryKey(),
	message: text().notNull(),
	success: boolean().notNull(),
	to_address: hex().notNull(),
	from_address: hex().notNull(),
});
