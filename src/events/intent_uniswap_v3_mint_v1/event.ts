import { asc, inArray, sql } from "drizzle-orm";
import {
	parseAbi,
	keccak256,
	getAddress,
	decodeFunctionData,
	encodeAbiParameters,
	getCreate2Address,
	toFunctionSelector,
} from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v3 } from "@/indexes/account-v3";
import { createId, getEventSuccess, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface IntentUniswapV3MintV1 {
	tag: "intent_uniswap_v3_mint_v1";
	id: string;
	success: boolean;
	fee: `0x${string}`;
	pool_address: `0x${string}`;
	sender_address: `0x${string}`;
	token_0_address: `0x${string}`;
	token_1_address: `0x${string}`;
	recipient_address: `0x${string}`;
	token_0_desired_quantity: `0x${string}`;
	token_1_desired_quantity: `0x${string}`;
	token_0_minimum_quantity: `0x${string}`;
	token_1_minimum_quantity: `0x${string}`;
}

export const UNISWAP_V3_POSITION_MANAGER_DEPLOYED_BLOCK = 12369651;
export const UNISWAP_V3_POSITION_MANAGER_ADDRESS = getAddress("0xC36442b4a4522E871399CD717aBDD847Ab11FE88");

const UNISWAP_V3_FACTORY_ADDRESS = getAddress("0x1F98431c8aD98523631AE4a59f267346ea31F984");
const UNISWAP_V3_POOL_INIT_CODE_HASH = "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";

const MINT_ABI = parseAbi([
	"function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline) params) payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
]);

const MINT_SELECTOR = toFunctionSelector(MINT_ABI[0]);

export const event = univo.event({
	id: "intent_uniswap_v3_mint_v1",

	filters: [
		{
			chain: 1,
			fromBlock: UNISWAP_V3_POSITION_MANAGER_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
			try {
				if (tx.to === null || !isHexEqual(tx.to, UNISWAP_V3_POSITION_MANAGER_ADDRESS)) {
					return [];
				}

				if (tx.input.slice(0, 10) !== MINT_SELECTOR) {
					return [];
				}

				const { args } = decodeFunctionData({ abi: MINT_ABI, data: tx.input });

				const params = args[0];

				const token0 = getAddress(params.token0);
				const token1 = getAddress(params.token1);

				const poolAddress = getCreate2Address({
					from: UNISWAP_V3_FACTORY_ADDRESS,
					bytecodeHash: UNISWAP_V3_POOL_INIT_CODE_HASH,
					salt: keccak256(
						encodeAbiParameters(
							[{ type: "address" }, { type: "address" }, { type: "uint24" }],
							[token0, token1, params.fee],
						),
					),
				});

				const id = createId({
					logIndex: TRANSACTION_EVENT,
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_uniswap_v3_mint_v1,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionHash, tx.hash));

				return {
					id,
					token_1_address: token1,
					token_0_address: token0,
					pool_address: poolAddress,
					fee: numberToHex(params.fee),
					success: getEventSuccess(receipt),
					sender_address: getAddress(tx.from),
					recipient_address: getAddress(params.recipient),
					token_0_minimum_quantity: numberToHex(params.amount0Min),
					token_1_minimum_quantity: numberToHex(params.amount1Min),
					token_0_desired_quantity: numberToHex(params.amount0Desired),
					token_1_desired_quantity: numberToHex(params.amount1Desired),
				};
			} catch {
				return [];
			}
		});
	},

	storage: {
		async upsert(batch) {
			const MAX_BATCH_SIZE = 8000;
			const client = await createPostgresClient();

			for (let i = 0; i < batch.length; i += MAX_BATCH_SIZE) {
				await client
					.insert(table)
					.values(batch.slice(i, i + MAX_BATCH_SIZE))
					.onConflictDoUpdate({
						target: table.id,
						set: {
							success: sql.raw(`excluded.${table.success.name}`),
							fee: sql.raw(`excluded.${table.fee.name}`),
							pool_address: sql.raw(`excluded.${table.pool_address.name}`),
							sender_address: sql.raw(`excluded.${table.sender_address.name}`),
							token_0_address: sql.raw(`excluded.${table.token_0_address.name}`),
							token_1_address: sql.raw(`excluded.${table.token_1_address.name}`),
							recipient_address: sql.raw(`excluded.${table.recipient_address.name}`),
							token_0_desired_quantity: sql.raw(`excluded.${table.token_0_desired_quantity.name}`),
							token_1_desired_quantity: sql.raw(`excluded.${table.token_1_desired_quantity.name}`),
							token_0_minimum_quantity: sql.raw(`excluded.${table.token_0_minimum_quantity.name}`),
							token_1_minimum_quantity: sql.raw(`excluded.${table.token_1_minimum_quantity.name}`),
						},
					});
			}
		},

		async delete(batch) {
			const client = await createPostgresClient();

			await client.delete(table).where(
				inArray(
					table.id,
					batch.map((event) => event.id),
				),
			);
		},
	},
});

univo.event({
	filters: event.filters,
	storage: index_block_number_tx_index_v4,
	id: "intent_uniswap_v3_mint_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_uniswap_v3_mint_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.pool_address },
				{ event_id: event.id, account: event.sender_address },
				{ event_id: event.id, account: event.token_0_address },
				{ event_id: event.id, account: event.token_1_address },
				{ event_id: event.id, account: event.recipient_address },
			];
		});
	},
});

export async function getIntentUniswapV3MintV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_uniswap_v3_mint_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentUniswapV3MintV1>((result) => {
		return {
			tag: "intent_uniswap_v3_mint_v1",
			id: result.id,
			success: result.success,
			fee: result.fee,
			pool_address: getAddress(result.pool_address),
			sender_address: getAddress(result.sender_address),
			token_0_address: getAddress(result.token_0_address),
			token_1_address: getAddress(result.token_1_address),
			recipient_address: getAddress(result.recipient_address),
			token_0_desired_quantity: result.token_0_desired_quantity,
			token_1_desired_quantity: result.token_1_desired_quantity,
			token_0_minimum_quantity: result.token_0_minimum_quantity,
			token_1_minimum_quantity: result.token_1_minimum_quantity,
		};
	});
}
