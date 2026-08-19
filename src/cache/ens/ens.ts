import { sql } from "drizzle-orm";
import { getAddress, toCoinType } from "viem";
import { waitUntil } from "cloudflare:workers";

import { inTuple } from "@/db/types";
import { getClient } from "@/clients";
import type { Chain } from "@/constants";
import { table } from "@/cache/ens/table";
import { createPostgresClient } from "@/db/client";
import { defineLoader, isHexEqual, logger } from "@/utils";
import { getEnsExistsForAccounts } from "@/events/log_ens_new_owner_v1/event";

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const getEnsNameForAccount = defineLoader(async (accounts: readonly { chain: Chain; address: `0x${string}` }[]) => {
	if (accounts.length === 0) {
		return [];
	}

	logger.debug(`Loading ENS for ${accounts.length} account(s)`);

	const client = await createPostgresClient();

	const rows = await client
		.select()
		.from(table)
		.where(
			inTuple(
				[table.chain, table.address],
				accounts.map((account) => [account.chain, getAddress(account.address)]),
			),
		);

	const accountsToRevalidate = accounts.filter((account) => {
		const entry = rows.find((row) => {
			return row.chain === account.chain && isHexEqual(row.address as `0x`, account.address);
		});

		// We revalidate any accounts that don't have a cache entry
		if (entry === undefined) {
			return true;
		}

		// We revalidate accounts with a cache greater than our defined TTL
		if (Date.now() - entry.created_at.getTime() > TTL_MS) {
			return true;
		}

		return false;
	});

	waitUntil(cacheEnsNames(accountsToRevalidate));

	return accounts.map((account) => {
		const row = rows.find((row) => {
			return row.chain === account.chain && isHexEqual(row.address as `0x`, account.address);
		});

		if (row === undefined) {
			return null;
		}

		return row.ens;
	});
});

async function cacheEnsNames(accounts: { chain: Chain; address: `0x${string}` }[]) {
	if (accounts.length === 0) {
		return;
	}

	logger.debug(`Revalidating ENS for ${accounts.length} account(s)`);

	// An optimisation to reduce the number of RPC calls is to first check if a given account
	// has ever claimed its reverse ENS node. This massively reduces the search space.

	const ensExists = await getEnsExistsForAccounts(accounts);

	const eligibleAccounts = accounts.filter((_, index) => {
		return ensExists[index];
	});

	logger.debug(`Found ${eligibleAccounts.length} eligible account(s)`);

	if (eligibleAccounts.length === 0) {
		return;
	}

	// This eligibility check isn't perfect. If an account has cleared it's ENS value we
	// simply cache the a null value for that account

	// What's not obvious here is that viem automatically batches these requests into a
	// single HTTP call. This is great because Cloudflare Workers can only fetch headers
	// for 6 requests concurrently

	const results = await Promise.allSettled(
		eligibleAccounts.map(async (account) => {
			const ens = await getEnsName(account);

			return {
				chain: account.chain,
				address: account.address,
				ens,
				created_at: new Date(),
			};
		}),
	);

	const ens = results.flatMap((result) => {
		if (result.status === "rejected") {
			return [];
		}

		return result.value;
	});

	if (ens.length === 0) {
		return;
	}

	const client = await createPostgresClient();

	await client
		.insert(table)
		.values(ens)
		.onConflictDoUpdate({
			target: [table.chain, table.address],
			set: {
				ens: sql.raw(`excluded.${table.ens.name}`),
				created_at: sql.raw(`excluded.${table.created_at.name}`),
			},
		});

	logger.debug(`Cached ${ens.length} ENS name(s)`);
}

async function getEnsName(opts: { chain: Chain; address: `0x${string}` }): Promise<string | null> {
	const client = getClient(opts.chain);

	// Might be worth implementing this ourselves with raw RPC calls? I don't mind this atm because
	// viem handles the details: it supports CCIP reads, ensures we perform both forward and reverse
	// resolution to prevent impersonation, and implements multi-chain resolution for ENSNIP-19

	// It's also important that we only ever load an ENS name that has finalized to prevent myriad
	// possible correctness issues with our change-based cache invalidation strategy

	const ens = await client.getEnsName({
		blockTag: "finalized",
		coinType: toCoinType(opts.chain),
		address: getAddress(opts.address),
	});

	return ens;
}

// Using a batch loader here allows us to deduplicate all cache invalidations into a single request

export const invalidateEnsCacheForAccount = defineLoader(async (accounts: readonly { chain: Chain; address: `0x${string}` }[]) => {
	if (accounts.length === 0) {
		return [];
	}

	logger.debug(`Invalidating ENS cache for ${accounts.length} account(s)`);

	const client = await createPostgresClient();

	await client
		.update(table)
		.set({ ens: null })
		.where(
			inTuple(
				[table.chain, table.address],
				accounts.map((account) => [account.chain, getAddress(account.address)]),
			),
		);

	return new Array(accounts.length).fill(true);
});
