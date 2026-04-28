import { getAddress } from "viem";

import { db } from "@/db/client";
import { logger } from "@/utils";

// Account indexes do not include a chain id intentionally. For now, it is preferred that the latest list of events
// returned for a given account should be multi-chain by default. This allows us to easily see the actions of specific
// accounts across chains within a similar time-frame.

// CREATE TABLE index_account_v1 (
//     `account` FixedString(42),
//     `event_id` FixedString(36)
// )
// ENGINE = ReplacingMergeTree
// ORDER BY (account, event_id);

export const index_account_v1 = {
	async upsert(indexes: { id: string; account: `0x${string}` }[]) {
		const unique: Record<string, true> = {};
		const values: { account: `0x${string}`; event_id: string }[] = [];
		const mapped = indexes.map((i) => ({ ...i, account: getAddress(i.account) }));

		for (const index of mapped) {
			if (unique[index.account + index.id]) continue;
			values.push({ account: index.account, event_id: index.id });
			unique[index.account + index.id] = true;
		}

		await db.insert({ table: "index_account_v1", format: "JSONEachRow", values });
	},
};

type Pagination = {
	limit: number;
	cursor?: string;
	order: "latest" | "reverse";
};

export async function getEventIdsForAccount(account: `0x${string}`, pagination: Pagination) {
	const start = Date.now();

	if (pagination.cursor) {
		const res = await db.query({
			query: `
				SELECT event_id
				FROM index_account_v1
				WHERE account = '${account}'
				AND event_id ${pagination.order === "latest" ? "<" : ">"} '${pagination.cursor}'
				ORDER BY event_id ${pagination.order === "latest" ? "DESC" : "ASC"}
				LIMIT ${pagination.limit}
			`,
			format: "JSONEachRow",
		});

		const rows: Record<string, string>[] = await res.json();
		logger.debug(`Found ${rows.length} events for index_account_v1 in ${Date.now() - start}ms`);

		return rows.map((row) => row.event_id) as string[];
	}

	const res = await db.query({
		query: `
			SELECT event_id 
			FROM index_account_v1 
			WHERE account = '${account}'
			ORDER BY event_id ${pagination.order === "latest" ? "DESC" : "ASC"} 
			LIMIT ${pagination.limit};
		`,
		format: "JSONEachRow",
	});

	const rows: Record<string, string>[] = await res.json();
	logger.debug(`Found ${rows.length} events for index_account_v1 ${account} in ${Date.now() - start}ms`);

	return rows.map((row) => row.event_id) as string[];
}
