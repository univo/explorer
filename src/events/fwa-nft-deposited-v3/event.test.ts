import { test } from "vitest";

import { event, FWA_ADDRESS, getFwaNftDepositedV3 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

const BLOCK_NUMBER = 25641949;
const DEPOSIT_TX_HASH = "0x2fe93ab36544d28f6997d5f2dceac1eea8985edbe2a59f6df8e7a70f74fc8786";

test.concurrent("fwa_nft_deposited_v3 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: BLOCK_NUMBER });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getFwaNftDepositedV3(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"fwa_nft_deposited_v3",
					"fwa_nft_deposited_v3_index_account_v3",
					"fwa_nft_deposited_v3_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getFwaNftDepositedV3(ids);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "backing_eth": "0xb1a2bc2ec50000",
		    "collection_address": "0x26D7Ad0E930b54b84C00DAad077Ee31Ba9e2Fb2E",
		    "depositor_address": "0x906691Bc9F0b5b505F3E9024B2e9342c554C7958",
		    "id": "6a6a9483018743dd0017ffffff00010014",
		    "success": true,
		    "tag": "fwa_nft_deposited_v3",
		    "token_id": "0x0afe",
		  },
		]
	`);
});

test.concurrent("fwa_nft_deposited_v3 includes failed submissions", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: BLOCK_NUMBER });

	const failed = {
		...block,

		eth_getBlockReceipts: block.eth_getBlockReceipts.map((receipt) => {
			if (receipt.transactionHash !== DEPOSIT_TX_HASH) {
				return receipt;
			}

			return {
				...receipt,
				status: "0x0" as const, // Mock the tx as failed
			};
		}),
	};

	expect(event.handler(failed)).toMatchObject([
		{
			success: false,
			token_id: "0xafe",
			backing_eth: "0xb1a2bc2ec50000",
			depositor_address: "0x906691Bc9F0b5b505F3E9024B2e9342c554C7958",
			collection_address: "0x26D7Ad0E930b54b84C00DAad077Ee31Ba9e2Fb2E",
		},
	]);
});

test.concurrent("fwa_nft_deposited_v3 requires the FWA address and listNFT selector", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: BLOCK_NUMBER });

	const depositTx = block.eth_getBlockByNumber.transactions.find((tx) => tx.hash === DEPOSIT_TX_HASH);

	expect(depositTx).toBeDefined();

	if (depositTx === undefined) {
		return;
	}

	const wrongAddressBlock = {
		...block,

		eth_getBlockByNumber: {
			...block.eth_getBlockByNumber,

			transactions: [
				{
					...depositTx,
					to: depositTx.from,
				},
			],
		},
	};

	const wrongSelectorBlock = {
		...block,

		eth_getBlockByNumber: {
			...block.eth_getBlockByNumber,

			transactions: [
				{
					...depositTx,
					to: FWA_ADDRESS,
					input: "0x" as const,
				},
			],
		},
	};

	expect(event.handler(wrongAddressBlock)).toStrictEqual([]);
	expect(event.handler(wrongSelectorBlock)).toStrictEqual([]);
});
