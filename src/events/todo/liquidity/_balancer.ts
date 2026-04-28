import { includesEvents } from "@/conditions/includesEvents";
import { createEvent } from "@/insights/createEvent";
import { Account } from "@/primitives/Account";
import { Token } from "@/primitives/Token";
import type { Handler } from "@/types/Handler";
import type { RawTransaction } from "@/types/RawTransaction";
import { assert } from "@/utils/misc/assert";
import { nonNullable } from "@/utils/misc/nonNullable";

const ADDRESS_LENGTH = 42;
export const getPoolAddressFromPoolId = (poolId: string) => poolId.slice(0, ADDRESS_LENGTH);

// (Join Pool): 0x34ca8d72ec4c9f29534f6f35835779ccb173fb909cf4d9e5ba2a815dd1fc06f6
// (Exit Pool): 0xa2a5afd3e5446cbc21db31a22d9731b1ccee1f4799e69577f7af9363eb09d883
const PoolBalanceChanged = createEvent("PoolBalanceChanged", [
	{ indexed: true, name: "poolId", type: "bytes32" },
	{ indexed: true, name: "liquidityProvider", type: "address" },
	{ indexed: false, name: "tokens", type: "address[]" },
	{ indexed: false, name: "deltas", type: "int256[]" },
	{ indexed: false, name: "protocolFeeAmounts", type: "uint256[]" },
]);

export const condition = (tx: RawTransaction) => includesEvents(tx, [PoolBalanceChanged]);

export const handler: Handler = async (tx) => {
	const promises = PoolBalanceChanged.decode(tx).map(async (log) => {
		const liquidityPoolAddress = getPoolAddressFromPoolId(log.outputs.poolId);

		return log.outputs.tokens
			.map((token, i) => {
				const quantity = log.outputs.deltas[i];
				assert(quantity, "Mapping over array of same length");

				if (quantity === "0") return null;

				return {
					quantity,
					hash: log.hash,
					type: "liquidityChange",
					token: new Token(token),
					liquidityPool: new Account(liquidityPoolAddress),
					action: quantity.startsWith("-") ? "remove" : "supply",
					liquidityProvider: new Account(log.outputs.liquidityProvider),
				};
			})
			.filter(nonNullable);
	});

	const results = await Promise.all(promises);

	return results.flat();
};
