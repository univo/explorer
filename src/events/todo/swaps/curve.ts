import { Account, defineHandler, definePrimitive, Token } from "univo";
import { http } from "viem";
import { createPublicClient } from "viem";
import { parseAbiItem } from "viem/abi";
import { mainnet } from "viem/chains";
import { decodeEventLog } from "viem/contract";

import { nonNullable } from "@/utils/non-nullable";

const viem = createPublicClient({ transport: http("") });

const TokenFromPoolIndex = definePrimitive({
	id: "tokenFromPoolIndex",
	load: async (id) => {
		const [pool, index] = id.split(":");

		const address = await viem.readContract({
			address: pool as "0x",
			args: [BigInt(index)],
			functionName: "coins",
			abi: [
				{
					name: "coins",
					type: "function",
					stateMutability: "view",
					outputs: [{ type: "address", name: "" }],
					inputs: [{ type: "uint256", name: "arg0" }],
				},
			],
		});

		return Token(address);
	},
});

// 0xd6b240a14752a3e024a4fc02d6b69f8aac7f5bbb575b7f20953456593296ff17
const TokenExchange = parseAbiItem(
	"event TokenExchange(address indexed buyer, int128 sold_id, uint256 tokens_sold, int128 bought_id, uint256 tokens_bought)",
);

export const curveSwap = defineHandler({
	filters: [{ type: "log", chain: mainnet.id, event: TokenExchange }],
	handler: (block) => {
		return block.transactions
			.flatMap((tx) => tx.logs)
			.map((log) => {
				try {
					const parsed = decodeEventLog({ strict: true, data: log.data, topics: log.topics, abi: [TokenExchange] });

					return {
						type: "swap",
						tx: log.transactionHash,
						to: Account(parsed.args.buyer),
						from: Account(parsed.args.buyer),
						liquidityPool: Account(log.address),
						tokens: {
							sold: {
								quantity: parsed.args.tokens_sold,
								token: TokenFromPoolIndex([log.address, parsed.args.sold_id].join(":")),
							},
							bought: {
								quantity: parsed.args.tokens_bought,
								token: Token([log.address, parsed.args.bought_id].join(":")),
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

// 0xdb1cc23d6d11d3622f6e7dd1f372333a23a43c8fe6e991d34744ba142a583a25
const TokenExchangeUnderlying = parseAbiItem(
	"event TokenExchangeUnderlying(address indexed buyer, int128 sold_id, uint256 tokens_sold, int128 bought_id, uint256 tokens_bought)",
);

export const curveSwapUnderlying = defineHandler({
	filters: [{ type: "log", chain: mainnet.id, event: TokenExchangeUnderlying }],
	handler: (block) => {
		return block.transactions
			.flatMap((tx) => tx.logs)
			.map((log) => {
				try {
					const parsed = decodeEventLog({
						strict: true,
						data: log.data,
						topics: log.topics,
						abi: [TokenExchangeUnderlying],
					});

					return {
						type: "swap",
						hash: log.transactionHash,
						to: Account(parsed.args.buyer),
						from: Account(parsed.args.buyer),
						liquidityPool: Account(log.address),
						tokens: {
							sold: {
								quantity: parsed.args.tokens_sold,
								token: TokenFromPoolIndex([log.address, parsed.args.sold_id].join(":")),
							},
							bought: {
								quantity: parsed.args.tokens_bought,
								token: Token([log.address, parsed.args.bought_id].join(":")),
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
