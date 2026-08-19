import { univo } from "@/lib/univo";
import { parseId } from "@/helpers";
import { invalidateEnsCacheForAccount } from "@/cache/ens/ens";
import { event as log_ens_name_for_addr_changed_v1 } from "@/events/log_ens_name_for_addr_changed_v1/event";

// We use a finalized handler here for correctness. A latest handler would be faster to invalidate
// because it skips the time to finalize, but it means a race condition could occur when we invalidate
// the new name, but before it finalizes onchain a new request caches the old finalized name

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
