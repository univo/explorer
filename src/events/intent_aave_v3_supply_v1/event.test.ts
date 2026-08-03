import { getAddress } from "viem";
import { test } from "vitest";

import { parseId } from "@/helpers";
import { test_client, test_getBlock } from "@/tests/utils";
import { AAVE_V3_ETHEREUM_POOL_ADDRESS, event, getIntentAaveV3SupplyV1 } from "./event";

const fixtures = [
	{
		name: "supply",
		blockNumber: 25621890,
		txHash: "0x63ce709568399533f200372a464ac5c6bf1ced6e30be4c061faf651ca812af63",
		expected: {
			quantity: "0x1e44dc0520",
			referral_code: "0x0",
			token_address: getAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
			supplier_address: getAddress("0xd411d428a63cf4c7029bc53f0e0f56c4933fdbb7"),
			on_behalf_of_address: getAddress("0xD411D428a63cf4c7029Bc53f0e0f56C4933FDbb7"),
		},
	},
	{
		name: "supplyWithPermit",
		blockNumber: 25622082,
		txHash: "0xf8c1d593f13d74ab1025760fbf01d530d949b6fb538d253a028ce1596ef54d25",
		expected: {
			quantity: "0x2723d945db3dad54",
			referral_code: "0x0",
			token_address: getAddress("0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"),
			supplier_address: getAddress("0x7f7c47b9a4160cb500f40aed289b67857701a9ac"),
			on_behalf_of_address: getAddress("0x7F7c47b9a4160cB500F40aeD289b67857701a9Ac"),
		},
	},
	{
		name: "deposit",
		blockNumber: 25635372,
		txHash: "0xbb7309588c502e7c5842d1f36e26fdf5286666bf75d921595a69e9d024f0f534",
		expected: {
			quantity: "0x28ab6d0",
			referral_code: "0x0",
			token_address: getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
			supplier_address: getAddress("0x44d15af7b0a5651eaa4a2f653a352ca5763aaec3"),
			on_behalf_of_address: getAddress("0x44d15Af7b0A5651EaA4a2F653a352Ca5763aaeC3"),
		},
	},
] as const;

test.concurrent.each(fixtures)("intent_aave_v3_supply_v1 decodes $name calldata", async ({ expect }, fixture) => {
	const block = await test_getBlock({ chain: 1, block_number: fixture.blockNumber });
	const transaction = block.eth_getBlockByNumber.transactions.find((tx) => tx.hash === fixture.txHash);

	expect(transaction).toBeDefined();

	if (transaction === undefined) {
		return;
	}

	const supply = event
		.handler(block)
		.find((candidate) => parseId(candidate.id).txIndex === Number(transaction.transactionIndex));

	expect(supply).toMatchObject({
		...fixture.expected,
		success: true,
	});
});

test.concurrent("intent_aave_v3_supply_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const fixture = fixtures[0];
	const block = await test_getBlock({ chain: 1, block_number: fixture.blockNumber });
	const events = event.handler(block);
	const transaction = block.eth_getBlockByNumber.transactions.find((tx) => tx.hash === fixture.txHash);
	const target = events.find((candidate) => parseId(candidate.id).txIndex === Number(transaction?.transactionIndex));

	expect(target).toBeDefined();

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	expect(await getIntentAaveV3SupplyV1(ids)).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_aave_v3_supply_v1",
					"intent_aave_v3_supply_v1_index_account_v3",
					"intent_aave_v3_supply_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const stored = await getIntentAaveV3SupplyV1(ids);

	expect(stored).toHaveLength(events.length);
	expect(stored).toContainEqual({
		...fixture.expected,
		tag: "intent_aave_v3_supply_v1",
		id: target?.id,
		success: true,
	});
});

test.concurrent("intent_aave_v3_supply_v1 uses receipt status without reading logs", async ({ expect }) => {
	const fixture = fixtures[0];
	const block = await test_getBlock({ chain: 1, block_number: fixture.blockNumber });

	const withoutLogs = {
		...block,
		eth_getBlockReceipts: block.eth_getBlockReceipts.map((receipt) => ({
			...receipt,
			logs: [],
		})),
	};

	expect(event.handler(withoutLogs)).toStrictEqual(event.handler(block));
});

test.concurrent("intent_aave_v3_supply_v1 includes failed submissions", async ({ expect }) => {
	const fixture = fixtures[0];
	const block = await test_getBlock({ chain: 1, block_number: fixture.blockNumber });

	const failed = {
		...block,
		eth_getBlockReceipts: block.eth_getBlockReceipts.map((receipt) => {
			if (receipt.transactionHash !== fixture.txHash) {
				return receipt;
			}

			return {
				...receipt,
				status: "0x0" as const,
				logs: [],
			};
		}),
	};

	const transaction = block.eth_getBlockByNumber.transactions.find((tx) => tx.hash === fixture.txHash);
	const supply = event
		.handler(failed)
		.find((candidate) => parseId(candidate.id).txIndex === Number(transaction?.transactionIndex));

	expect(supply).toMatchObject({
		...fixture.expected,
		success: false,
	});
});

test.concurrent("intent_aave_v3_supply_v1 requires a direct Pool call with valid calldata", async ({ expect }) => {
	const fixture = fixtures[0];
	const block = await test_getBlock({ chain: 1, block_number: fixture.blockNumber });
	const transaction = block.eth_getBlockByNumber.transactions.find((tx) => tx.hash === fixture.txHash);

	expect(transaction).toBeDefined();

	if (transaction === undefined) {
		return;
	}

	const withTransaction = (overrides: Partial<typeof transaction>): typeof block => {
		const modified = { ...transaction, ...overrides } as typeof transaction;

		return {
			...block,
			eth_getBlockByNumber: {
				...block.eth_getBlockByNumber,
				transactions: [modified],
			},
		};
	};

	expect(event.handler(withTransaction({ to: transaction.from }))).toStrictEqual([]);
	expect(event.handler(withTransaction({ to: AAVE_V3_ETHEREUM_POOL_ADDRESS, input: "0xdeadbeef" }))).toStrictEqual([]);
	expect(event.handler(withTransaction({ to: AAVE_V3_ETHEREUM_POOL_ADDRESS, input: "0x617ba037" }))).toStrictEqual([]);
});
