import { getAddress } from "viem";

import { univo } from "@/lib/univo";
import { parseId } from "@/helpers";
import { inTuple } from "@/db/types";
import type { Chain } from "@/constants";
import { defineBatchLoader } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { table as state_accounts_v3 } from "@/state/account";
import { event as log_ens_name_for_addr_changed_v1 } from "@/events/log_ens_name_for_addr_changed_v1/event";

const invalidateEnsCacheForAccount = defineBatchLoader(async (accounts: readonly { chain: Chain; address: `0x${string}` }[]) => {
	if (accounts.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	await client
		.update(state_accounts_v3)
		.set({ ens: null })
		.where(
			inTuple(
				[state_accounts_v3.chain, state_accounts_v3.address],
				accounts.map((account) => [account.chain, getAddress(account.address)]),
			),
		);

	return new Array(accounts.length).fill(true);
});

univo.action({
	id: "invalidate_ens_cache",

	event: log_ens_name_for_addr_changed_v1,

	handler: {
		finalized: async (event) => {
			const { chainId } = parseId(event.id);

			await invalidateEnsCacheForAccount({ chain: chainId, address: event.account_address });
		},
	},
});
