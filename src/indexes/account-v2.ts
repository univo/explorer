import { getAddress } from "viem";

import { db } from "@/db/client";
import { logger } from "@/utils";

// Account indexes do not include a chain intentionally. For now, it is preferred that the list of events returned for
// a given account should be multichain by default. This allows us to easily see the actions of specific accounts across
// chains within a similar time-frame.

// CREATE TABLE index_account_v2 (
//     `account` FixedString(20),
//     `event_id` FixedString(16)
// )
// ENGINE = ReplacingMergeTree
// ORDER BY (account, event_id);

type Index = {
	account: `0x${string}`;
	event_id: string;
};

export const index_account_v2 = {
	async upsert(indexes: Index[]) {
		const unique: Record<string, true> = {};

		const values: Index[] = [];

		for (const index of indexes) {
			const key = [index.account, index.event_id].join(":");

			if (unique[key]) {
				continue;
			}

			unique[key] = true;

			values.push({
				account: getAddress(index.account),
				event_id: index.event_id,
			});
		}

		const mapped = indexes.map((value) => {
			return `(
                unhex('${value.account.slice(2)}'),
                unhex('${value.event_id}')
            )`;
		});

		await db.command({
			query: `INSERT INTO index_account_v2 (account, event_id) VALUES ${mapped.join(",")}`,
		});
	},

	async delete(indexes: Index[]) {
		const mapped = indexes.map((value) => {
			return `(
				unhex('${value.account.slice(2)}'),
				unhex('${value.event_id}')
			)`;
		});

		await db.command({
			query: `DELETE FROM index_account_v2 WHERE (account, event_id) IN (${mapped.join(",")})`,
		});
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
				SELECT lower(hex(event_id))
				FROM index_account_v2
				WHERE account = unhex('${getAddress(account).slice(2)}')
				AND event_id ${pagination.order === "latest" ? "<" : ">"} unhex('${pagination.cursor}')
				ORDER BY event_id ${pagination.order === "latest" ? "DESC" : "ASC"}
				LIMIT ${pagination.limit}
			`,
			format: "JSONEachRow",
		});

		const rows: Record<string, string>[] = await res.json();

		logger.debug(`Found ${rows.length} events for account in ${Date.now() - start}ms`);

		return rows.map((row) => row["lower(hex(event_id))"]) as string[];
	}

	const res = await db.query({
		query: `
			SELECT lower(hex(event_id))
			FROM index_account_v2 
			WHERE account = unhex('${getAddress(account).slice(2)}')
			ORDER BY event_id ${pagination.order === "latest" ? "DESC" : "ASC"} 
			LIMIT ${pagination.limit};
		`,
		format: "JSONEachRow",
	});

	const rows: Record<string, string>[] = await res.json();

	logger.debug(`Found ${rows.length} events for account in ${Date.now() - start}ms`);

	return rows.map((row) => row["lower(hex(event_id))"]) as string[];
}
