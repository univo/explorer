import { index, pgTable } from "drizzle-orm/pg-core";

import { hex, id } from "@/db/types";

export const table = pgTable(
	"event_fwa_nft_listed_v3",
	{
		id: id().primaryKey(),
		slot: hex().notNull(),
		weight: hex().notNull(),
		token_id: hex().notNull(),
		listing_id: hex().notNull(),
		backing_eth: hex().notNull(),
		depositor_address: hex().notNull(),
		collection_address: hex().notNull(),
	},
	(table) => [
		// Allows us to perform joins on the listing id from other events
		index("event_fwa_nft_listed_v3_listing_id_idx").on(table.listing_id),
	],
);
