import { Account, defineHandler } from "univo";
import { decodeEventLog, parseAbiItem } from "viem";
import { mainnet } from "viem/chains";

import { nonNullable } from "@/utils/non-nullable";

// V2Swap: 0x3191bc285d1a748aa1bc2c3cad7e0151729807430b7d212c0a85964e5cb9f06f
// V2Swap: 0xdb49239617f5dbaf55773186e4601b0d2a83bbf48a19b635e9e99478c74cf16b
const V2Swap = parseAbiItem(
	"event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
);

export const uniswapV2Swap = defineHandler({
	filters: [{ type: "log", chain: mainnet.id, event: V2Swap }],
	handler: (block) => {
		return block.transactions
			.flatMap((tx) => tx.logs)
			.map(async (log) => {
				try {
					const parsed = decodeEventLog({ abi: [V2Swap], strict: true, data: log.data, topics: log.topics });

					const [address0, address1] = await deps.loaders.pairContractTokens.load(log.address);

					const [token0, token1] = await Promise.all([
						deps.loaders.token.load(address0),
						deps.loaders.token.load(address1),
					]);

					const wasToken0Sold = parsed.args.amount0In !== 0n;
					const soldToken = wasToken0Sold ? token0 : token1;
					const boughtToken = wasToken0Sold ? token1 : token0;

					return {
						type: "swap",
						tx: log.transactionHash,
						to: Account(parsed.args.to),
						from: Account(parsed.args.sender),
						liquidityPool: Account(log.address),
						tokens: {
							sold: {
								token: soldToken,
								quantity: wasToken0Sold ? parsed.args.amount0In : parsed.args.amount1In,
							},
							bought: {
								token: boughtToken,
								quantity: wasToken0Sold ? parsed.args.amount1Out : parsed.args.amount0Out,
							},
						},
					} as const;
				} catch {
					return null;
				}
			})
			.filter(nonNullable);
	},
});

const V3Swap = parseAbiItem(
	"event Swap(address indexed sender, address indexed receiver, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
);

export const uniswapV3Swap = defineHandler({
	filters: [{ type: "log", chain: mainnet.id, event: V3Swap }],
	handler: (block) => {
		return block.transactions
			.flatMap((tx) => tx.logs)
			.map(async (log) => {
				try {
					const parsed = decodeEventLog({ strict: true, abi: [V3Swap], data: log.data, topics: log.topics });

					const [address0, address1] = await deps.loaders.pairContractTokens.load(log.address);

					const [token0, token1] = await Promise.all([
						deps.loaders.token.load(address0),
						deps.loaders.token.load(address1),
					]);

					const wasToken0Sold = parsed.args.amount0 < 0n;
					const soldToken = wasToken0Sold ? token0 : token1;
					const boughtToken = wasToken0Sold ? token1 : token0;

					return {
						type: "swap",
						hash: log.transactionHash,
						to: Account(parsed.args.receiver),
						from: Account(parsed.args.sender),
						liquidityPool: Account(log.address),
						tokens: {
							sold: {
								token: soldToken,
								quantity: wasToken0Sold ? parsed.args.amount0 : parsed.args.amount1,
							},
							bought: {
								token: boughtToken,
								quantity: wasToken0Sold ? parsed.args.amount1 : parsed.args.amount0,
							},
						},
					} as const;
				} catch {
					return null;
				}
			})
			.filter(nonNullable);
	},
});
