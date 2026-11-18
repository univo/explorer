import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";

import { PRESETS } from "./constants";
import { AddressSchema, PresetSchema } from "./schema";
import { getEventIdsForAccount } from "./indexes/index_account_v4";

// It is vitally important that neither the file name nor the function name is changed. Server function
// identifiers are stable according to these two things. So any time they are updated we will break old
// clients fetching a new endpoint and will also purge any caches. This should eventually be a build time
// check or moved to a static API route.

// https://tanstack.com/start/v0/docs/framework/react/guide/server-functions#function-id-generation-for-production-build

/**
 * Returns the latest event id for a given account
 */
export const sf_getLatestEventForAccount = createServerFn({ method: "GET" })
	.inputValidator(v.object({ address: AddressSchema, preset: PresetSchema }))
	.handler(async ({ data }) => {
		const [id] = await getEventIdsForAccount(data.address, {
			limit: 1,
			order: "latest",
			chains: [1, 42161],
			tables: PRESETS[data.preset],
		});

		if (id === undefined) {
			return null;
		}

		return id;
	});
