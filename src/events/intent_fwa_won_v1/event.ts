import { getAddress } from "viem";
import { asc, inArray } from "drizzle-orm";

import { table } from "./table";
import { parseId } from "@/helpers";
import { TABLES } from "@/constants";
import { createPostgresClient } from "@/db/client";

export interface IntentFwaWonV1 {
	tag: "intent_fwa_won_v1";
	id: string;
	success: boolean;
	token_out: `0x${string}`;
	listing_id: `0x${string}`;
	payout_eth: `0x${string}`;
	retained_eth: `0x${string}`;
	purchaser_address: `0x${string}`;
	depositor_address: `0x${string}`;
	settlement_type: "kept" | "relisted" | "accepted_eth" | "accepted_fwa";
}

export async function getIntentFwaWonV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_fwa_won_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentFwaWonV1>((result) => {
		return {
			tag: "intent_fwa_won_v1" as const,
			id: result.id,
			success: result.success,
			token_out: result.token_out,
			listing_id: result.listing_id,
			payout_eth: result.payout_eth,
			retained_eth: result.retained_eth,
			settlement_type: result.settlement_type as "kept" | "relisted" | "accepted_eth" | "accepted_fwa",
			purchaser_address: getAddress(result.purchaser_address),
			depositor_address: getAddress(result.depositor_address),
		};
	});
}
