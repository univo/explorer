import { boolean, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable("event_contract_deployment_v3", {
	id: id().primaryKey(),
	success: boolean().notNull(),
	contract_address: hex().notNull(),
	deployer_address: hex().notNull(),
});
