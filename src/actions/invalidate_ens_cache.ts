import { univo } from "@/univo";
import { getExternalChain } from "@/helpers";
import { invalidateEnsCacheForAccount } from "@/cache/ens/ens";
import { event as log_ens_name_for_addr_changed_v2 } from "@/events/log_ens_name_for_addr_changed_v2/event";

// We use a finalized handler here for correctness. A latest handler would be faster to invalidate
// because it skips the time to finalize, but it means a race condition could occur when we invalidate
// the new name, but before it finalizes onchain a new request caches the old finalized name

univo.action({
	id: "invalidate_ens_cache",

	event: log_ens_name_for_addr_changed_v2,

	handler: async (event) => {
		await invalidateEnsCacheForAccount({ chain: getExternalChain(event.chain), address: event.account_address });
	},
});
