import { asc, inArray } from "drizzle-orm";
import { getAddress } from "viem";

import { table } from "./table";
import { parseId } from "@/helpers";
import { TABLES } from "@/constants";
import { createPostgresClient } from "@/db/client";

export interface EnsNameRegisteredV3 {
	tag: "ens_name_registered_v3";
	id: string;
	success: boolean;
	name: string;
	cost_eth: `0x${string}`;
	expires_at: `0x${string}`;
	owner_address: `0x${string}`;
}

// Historical reader for registrations indexed before intent_ens_name_registered_v1.

export async function getEnsNameRegisteredV3(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.ens_name_registered_v3);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<EnsNameRegisteredV3>((result) => {
		return {
			tag: "ens_name_registered_v3" as const,
			id: result.id,
			name: result.name,
			success: result.success,
			cost_eth: result.cost_eth,
			expires_at: result.expires_at,
			owner_address: getAddress(result.owner_address),
		};
	});
}
