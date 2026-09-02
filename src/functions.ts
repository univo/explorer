import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";

import { rpc } from "./helpers";
import { TxHashSchema } from "./schema";
import { hashstring, hexToNumber } from "./utils";
import { getEventIdsForAccount } from "./indexes/account-v3";

// It is vitally important that neither the file name nor the function name is changed. Server function
// identifiers are stable according to these two things. So any time they are updated we will break old
// clients fetching a new endpoint and will also purge any caches. This should eventually be a build time
// check or moved to a static API route.

// https://tanstack.com/start/v0/docs/framework/react/guide/server-functions#function-id-generation-for-production-build

/**
 * Allow us to to convert a transaction hash to its transaction position
 */
export const sf_getTxPosition = createServerFn({ method: "GET" })
	.inputValidator(v.object({ tx_hash: TxHashSchema }))
	.handler(async ({ data }) => {
		const tx = await rpc({
			id: 1,
			jsonrpc: "2.0",
			params: [data.tx_hash],
			method: "eth_getTransactionByHash",
		});

		if (tx === null) {
			throw new Error("Unknown transaction");
		}

		return {
			block: hexToNumber(tx.blockNumber),
			tx: hexToNumber(tx.transactionIndex),
		};
	});

/**
 * Returns the latest event id for a given account
 */
export const sf_getLatestEventForAccount = createServerFn({ method: "GET" })
	.inputValidator(v.object({ address: hashstring(), cursor: v.string() }))
	.handler(async ({ data }) => {
		const [id] = await getEventIdsForAccount(data.address, {
			limit: 1,
			order: "latest",
		});

		if (id === undefined) {
			return null;
		}

		return id;
	});
