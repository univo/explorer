import { asc, inArray, sql } from "drizzle-orm";
import { decodeFunctionData, getAddress, parseAbi, toFunctionSelector } from "viem";

import { table } from "./table";
import { univo } from "@/lib/univo";
import { isHexEqual, numberToHex } from "@/utils";
import { createPostgresClient } from "@/db/client";
import { TABLES, TRANSACTION_EVENT } from "@/constants";
import { index_account_v3 } from "@/indexes/account-v3";
import { createId, getEventSuccess, parseId } from "@/helpers";
import { index_block_number_tx_index_v4 } from "@/indexes/block-number-tx-index-v4";

export interface IntentAaveV3RepayV1 {
	tag: "intent_aave_v3_repay_v1";
	id: string;
	success: boolean;
	use_atokens: boolean;
	quantity: `0x${string}`;
	token_address: `0x${string}`;
	repayer_address: `0x${string}`;
	interest_rate_mode: `0x${string}`;
	on_behalf_of_address: `0x${string}`;
}

export const AAVE_V3_ETHEREUM_POOL_DEPLOYED_BLOCK = 16291127;
export const AAVE_V3_ETHEREUM_POOL_ADDRESS = getAddress("0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2");

const REPAY_ABI = parseAbi([
	"function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf)",
	"function repayWithPermit(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf, uint256 deadline, uint8 permitV, bytes32 permitR, bytes32 permitS)",
	"function repayWithATokens(address asset, uint256 amount, uint256 interestRateMode)",
]);

const REPAY_SELECTORS = new Set<string>(REPAY_ABI.map(toFunctionSelector));

export const event = univo.event({
	id: "intent_aave_v3_repay_v1",

	filters: [
		{
			chain: 1,
			address: AAVE_V3_ETHEREUM_POOL_ADDRESS,
			fromBlock: AAVE_V3_ETHEREUM_POOL_DEPLOYED_BLOCK,
		},
	],

	handler: (block) => {
		return block.eth_getBlockByNumber.transactions.flatMap((tx) => {
			try {
				if (tx.to === null || !isHexEqual(tx.to, AAVE_V3_ETHEREUM_POOL_ADDRESS)) {
					return [];
				}

				if (!REPAY_SELECTORS.has(tx.input.slice(0, 10))) {
					return [];
				}

				const decoded = decodeFunctionData({ abi: REPAY_ABI, data: tx.input });
				const useATokens = decoded.functionName === "repayWithATokens";
				const onBehalfOf = useATokens ? tx.from : decoded.args[3];

				const id = createId({
					logIndex: TRANSACTION_EVENT,
					chainId: block.eth_chainId,
					txIndex: tx.transactionIndex,
					tableId: TABLES.intent_aave_v3_repay_v1,
					blockNumber: block.eth_getBlockByNumber.number,
					blockTimestamp: block.eth_getBlockByNumber.timestamp,
				});

				const receipt = block.eth_getBlockReceipts.find((receipt) => isHexEqual(receipt.transactionHash, tx.hash));

				return {
					id,
					use_atokens: useATokens,
					success: getEventSuccess(receipt),
					repayer_address: getAddress(tx.from),
					quantity: numberToHex(decoded.args[1]),
					token_address: getAddress(decoded.args[0]),
					on_behalf_of_address: getAddress(onBehalfOf),
					interest_rate_mode: numberToHex(decoded.args[2]),
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
							quantity: sql.raw(`excluded.${table.quantity.name}`),
							use_atokens: sql.raw(`excluded.${table.use_atokens.name}`),
							token_address: sql.raw(`excluded.${table.token_address.name}`),
							repayer_address: sql.raw(`excluded.${table.repayer_address.name}`),
							interest_rate_mode: sql.raw(`excluded.${table.interest_rate_mode.name}`),
							on_behalf_of_address: sql.raw(`excluded.${table.on_behalf_of_address.name}`),
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
	id: "intent_aave_v3_repay_v1_index_block_number_tx_index_v4",
	handler: (block) => event.handler(block).map((event) => event.id),
});

univo.event({
	filters: event.filters,
	storage: index_account_v3,
	id: "intent_aave_v3_repay_v1_index_account_v3",
	handler: (block) => {
		return event.handler(block).flatMap((event) => {
			return [
				{ event_id: event.id, account: event.token_address },
				{ event_id: event.id, account: event.repayer_address },
				{ event_id: event.id, account: event.on_behalf_of_address },
				{ event_id: event.id, account: AAVE_V3_ETHEREUM_POOL_ADDRESS },
			];
		});
	},
});

export async function getIntentAaveV3RepayV1(ids: string[]) {
	const filtered = ids.filter((id) => parseId(id).tableId === TABLES.intent_aave_v3_repay_v1);

	if (filtered.length === 0) {
		return [];
	}

	const client = await createPostgresClient();

	const rows = await client
		.select() //
		.from(table)
		.where(inArray(table.id, filtered))
		.orderBy(asc(table.id));

	return rows.map<IntentAaveV3RepayV1>((result) => {
		return {
			tag: "intent_aave_v3_repay_v1" as const,
			id: result.id,
			success: result.success,
			quantity: result.quantity,
			use_atokens: result.use_atokens,
			interest_rate_mode: result.interest_rate_mode,
			token_address: getAddress(result.token_address),
			repayer_address: getAddress(result.repayer_address),
			on_behalf_of_address: getAddress(result.on_behalf_of_address),
		};
	});
}
