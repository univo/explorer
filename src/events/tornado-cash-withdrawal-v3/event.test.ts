import { test } from "vitest";

import { event, getTornadoCashWithdrawalV3 } from "./event";
import { test_getBlock, test_client } from "@/tests/utils";

// 0x9bb7303af6ce69085abc3d9f4f5b7884a90023fd6e5925cb6ffed9737ebff78c
// From address, recipient address, and relay address are all the same

test.concurrent("tornado_cash_withdrawal_v3 direct pool withdrawal", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 9117176 });

	console.log(event.handler(block));

	await event.storage.delete(event.handler(block));

	const ids = event.handler(block).map((event) => event.id);
	const initial = await getTornadoCashWithdrawalV3(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"tornado_cash_withdrawal_v3",
					"tornado_cash_withdrawal_v3_index_account_v3",
					"tornado_cash_withdrawal_v3_index_block_number_tx_index_v4",
					"native_transfer_v3",
					"native_transfer_v3_index_account_v3",
					"native_transfer_v3_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const events = await getTornadoCashWithdrawalV3(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "fee": "0x00",
		    "from_address": "0x0039F22efB07A647557C7C5d17854CFD6D489eF3",
		    "id": "5df7e34a008b1df8003300000000010012",
		    "pool_address": "0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc",
		    "recipient_address": "0x0039F22efB07A647557C7C5d17854CFD6D489eF3",
		    "relayer_address": "0x0039F22efB07A647557C7C5d17854CFD6D489eF3",
		    "success": true,
		    "tag": "tornado_cash_withdrawal_v3",
		    "to_address": "0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc",
		  },
		]
	`);
});

// 0x32fe4de649de55851e98f13e29c4a8b2bf2538592e9c575a268d1570e6187d31
// From address, recipient address, and relay address are all different

test.concurrent("tornado_cash_withdrawal_v3 proxy withdrawal", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 11843313 });

	console.log(event.handler(block));

	await event.storage.delete(event.handler(block));

	const ids = event.handler(block).map((event) => event.id);
	const initial = await getTornadoCashWithdrawalV3(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"tornado_cash_withdrawal_v3",
					"tornado_cash_withdrawal_v3_index_account_v3",
					"tornado_cash_withdrawal_v3_index_block_number_tx_index_v4",
					"native_transfer_v3",
					"native_transfer_v3_index_account_v3",
					"native_transfer_v3_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const events = await getTornadoCashWithdrawalV3(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "fee": "0x016ed5e01c487000",
		    "from_address": "0x03EbD2ea2B9F23669C9Eb05C2a1a39f99CBDf372",
		    "id": "6026c1c700b4b6f1010c00000000010012",
		    "pool_address": "0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936",
		    "recipient_address": "0x3f20e968a304Bc825Aa1a45228FdfD2D3D90c6Af",
		    "relayer_address": "0xDdbfCEd30862c0105673B38dFf5e941cf48830e4",
		    "success": true,
		    "tag": "tornado_cash_withdrawal_v3",
		    "to_address": "0x905b63Fff465B9fFBF41DeA908CEb12478ec7601",
		  },
		]
	`);
});

// 0xb90542104cef79b00e0b922d9527a72ca69849fcbfd9607ea16d0c2bb38cfe86
// tx.from:   0xf26cD36202083D171F3dD20A29a7AcbCAd8C6810
// recipient: 0xf26cD36202083D171F3dD20A29a7AcbCAd8C6810
// relayer:   0x0000000000000000000000000000000000000000
// This is a self-submitted withdrawal. However the unused relayer parameter is the zero address.

// 0x9181a1ec35586a5fd8f5dc9208c36b6beb40a041f5a9477b25e67cc3bfe25f64
// tx.from:   0xefAB18983029d2BA840E34698eFb67fDF8120711
// recipient: 0x0F416BC2d310A1C32bC1081cf354c15FD10d4802
// relayer:   0xefAB18983029d2BA840E34698eFb67fDF8120711
// This is the conventional relayed case: the submitter also receives the fee.

// 0x888851e8bed0a1df3e273eb4ba1660ebe5cc496ba980875ee427dacc8989ad53
// tx.from:   0x9727ca412f87d46cd4bb6022d27477b232ea8970
// recipient: 0x81708914E4f78F391c1369D0C7cebF2F5Ba40Ae1
// relayer:   0x81708914E4f78F391c1369D0C7cebF2F5Ba40Ae1
// A third party submitted this transaction, but the recipient was also designated as the relayer.
// Since the fee was zero, the submitting address received no Tornado fee.
