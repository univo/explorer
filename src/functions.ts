import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";

import { getTxHash } from "./events/tx-hashes-v1/event";

// It is vitally important that neither the file name nor the function name is changed. Server function
// identifiers are stable according to these two things. So any time they are updated we will break old
// clients fetching a new endpoint and will also purge any caches. This should eventually be a build time
// check or moved to a static API route.

// https://tanstack.com/start/v0/docs/framework/react/guide/server-functions#function-id-generation-for-production-build

export const sf_getTxHash = createServerFn({ method: "GET" })
	.inputValidator(v.object({ block_timestamp: v.number(), block_number: v.number(), tx_index: v.number() }))
	.handler(async ({ data }) => {
		const tx = await getTxHash({ block_number: data.block_number, tx_index: data.tx_index });

		if (tx === null) {
			throw new Error("Unknown block number and transaction index");
		}

		return tx;
	});
