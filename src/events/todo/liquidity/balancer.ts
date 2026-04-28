import { includesEvents } from "@/conditions/includesEvents";
import { createEvent } from "@/insights/createEvent";
import type { Interpreter } from "@/insights/interpretTx";
import { assert } from "@/utils/misc/assert";
import { nonNullable } from "@/utils/misc/nonNullable";

import type { LiquidityChange } from ".";

const ADDRESS_LENGTH = 42;
export const getPoolAddressFromPoolId = (poolId: string) => poolId.slice(0, ADDRESS_LENGTH);

// (Join Pool): 0x34ca8d72ec4c9f29534f6f35835779ccb173fb909cf4d9e5ba2a815dd1fc06f6
// (Exit Pool): 0xa2a5afd3e5446cbc21db31a22d9731b1ccee1f4799e69577f7af9363eb09d883
const event = createEvent("PoolBalanceChanged", [
	{ indexed: true, name: "poolId", type: "bytes32" },
	{ indexed: true, name: "liquidityProvider", type: "address" },
	{ indexed: false, name: "tokens", type: "address[]" },
	{ indexed: false, name: "deltas", type: "int256[]" },
	{ indexed: false, name: "protocolFeeAmounts", type: "uint256[]" },
]);

export const balancerChange: Interpreter<LiquidityChange> = {
	name: "liquidityChange_balancerChange",
	condition: (tx) => includesEvents(tx, [event]),
	handler: (deps) => async (tx) => {
		const promises = event.decode(tx).map<Promise<LiquidityChange[]>>(async (log) => {
			const liquidityPoolAddress = getPoolAddressFromPoolId(log.outputs.poolId);

			const [liquidityPool, liquidityProvider, ...tokens] = await Promise.all([
				deps.loaders.account.load(liquidityPoolAddress),
				deps.loaders.account.load(log.outputs.liquidityProvider),
				...log.outputs.tokens.map((address) => deps.loaders.token.load(address)),
			]);

			return tokens
				.map<LiquidityChange | null>((token, i) => {
					const quantity = log.outputs.deltas[i];
					assert(quantity, "Mapping over array of same length");

					if (quantity === "0") return null;

					return {
						token,
						quantity,
						hash: log.hash,
						type: "liquidityChange",
						action: quantity.startsWith("-") ? "remove" : "supply",
						liquidityPool: { address: liquidityPoolAddress, account: liquidityPool },
						liquidityProvider: { address: log.outputs.liquidityProvider, account: liquidityProvider },
					};
				})
				.filter(nonNullable);
		});

		const results = await Promise.all(promises);

		return results.flat();
	},
};
