import { test } from "vitest";

import { event, getIntentUniswapV3SwapV1 } from "./event";
import { test_client, test_getBlock } from "@/tests/utils";

test.concurrent("intent_uniswap_v3_swap_v1 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25678351 });

	const events = event.handler(block);

	await event.storage.delete(events);

	const ids = events.map((event) => event.id);

	const initial = await getIntentUniswapV3SwapV1(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_uniswap_v3_swap_v1", //
					"intent_uniswap_v3_swap_v1_index_account_v3",
					"intent_uniswap_v3_swap_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const final = await getIntentUniswapV3SwapV1(ids);

	expect(final).toMatchInlineSnapshot(`
		[
		  {
		    "exact_quantity": "0x03bc2b2b2868c7",
		    "id": "6a71447b0187d20f0037ffffff0001001b",
		    "limit_quantity": "0x00",
		    "recipient_address": "0xd32f19caacFA558bd5864464E4d7560306D9fE3E",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0xd32f19caacFA558bd5864464E4d7560306D9fE3E",
		    "success": true,
		    "swap_type": "exact_input",
		    "tag": "intent_uniswap_v3_swap_v1",
		    "token_in_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		    "token_out_address": "0x95AF4aF910c28E8EcE4512BFE46F1F33687424ce",
		  },
		  {
		    "exact_quantity": "0x01ae805eefa1dc",
		    "id": "6a71447b0187d20f0038ffffff0001001b",
		    "limit_quantity": "0x00",
		    "recipient_address": "0x0eE4B7145741616E37bc04Cf6ae38a1e73cc4915",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0x0eE4B7145741616E37bc04Cf6ae38a1e73cc4915",
		    "success": true,
		    "swap_type": "exact_input",
		    "tag": "intent_uniswap_v3_swap_v1",
		    "token_in_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		    "token_out_address": "0x95AF4aF910c28E8EcE4512BFE46F1F33687424ce",
		  },
		  {
		    "exact_quantity": "0x047608d3059f0f",
		    "id": "6a71447b0187d20f003affffff0001001b",
		    "limit_quantity": "0x00",
		    "recipient_address": "0x934eB981c5745DE39CC36Fb0BBCfcEbcA4cF76e2",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0x934eB981c5745DE39CC36Fb0BBCfcEbcA4cF76e2",
		    "success": true,
		    "swap_type": "exact_input",
		    "tag": "intent_uniswap_v3_swap_v1",
		    "token_in_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		    "token_out_address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
		  },
		  {
		    "exact_quantity": "0x05fc",
		    "id": "6a71447b0187d20f003fffffff0001001b",
		    "limit_quantity": "0xc7adff51a5f4",
		    "recipient_address": "0x2FEF0275663a8dEe208c5e5E88c81630De8359E8",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0x2FEF0275663a8dEe208c5e5E88c81630De8359E8",
		    "success": true,
		    "swap_type": "exact_input",
		    "tag": "intent_uniswap_v3_swap_v1",
		    "token_in_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		    "token_out_address": "0x8B1484d57abBE239bB280661377363b03c89CaEa",
		  },
		  {
		    "exact_quantity": "0x01737c715db8c0",
		    "id": "6a71447b0187d20f0040ffffff0001001b",
		    "limit_quantity": "0x00",
		    "recipient_address": "0x9b056E2fd1b96A5d2494a303daCCE77200F61B96",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0x9b056E2fd1b96A5d2494a303daCCE77200F61B96",
		    "success": true,
		    "swap_type": "exact_input",
		    "tag": "intent_uniswap_v3_swap_v1",
		    "token_in_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		    "token_out_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		  },
		]
	`);
});

test.concurrent("intent_uniswap_v3_swap_v1 handles all function selectors", async ({ expect }) => {
	const b25678346 = await test_getBlock({ chain: 1, block_number: 25678346 });

	expect(event.handler(b25678346)).toMatchInlineSnapshot(`
		[
		  {
		    "exact_quantity": "0x22c403cd9fd11a942",
		    "id": "6a71443f0187d20a00e6ffffff0001001b",
		    "limit_quantity": "0x10d815a7",
		    "recipient_address": "0x6FFb71E3c9C0F8ec2DbdCF19C1a1A8cf8acE6B18",
		    "router_address": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
		    "sender_address": "0x6FFb71E3c9C0F8ec2DbdCF19C1a1A8cf8acE6B18",
		    "success": true,
		    "swap_type": "exact_output",
		    "token_in_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		    "token_out_address": "0x8B1484d57abBE239bB280661377363b03c89CaEa",
		  },
		  {
		    "exact_quantity": "0x3660893b0da985783",
		    "id": "6a71443f0187d20a00e9ffffff0001001b",
		    "limit_quantity": "0x1a58e2b6",
		    "recipient_address": "0xE455FC5B0e46bB3FC17D09D75D6092C803316Ba9",
		    "router_address": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
		    "sender_address": "0xE455FC5B0e46bB3FC17D09D75D6092C803316Ba9",
		    "success": true,
		    "swap_type": "exact_output",
		    "token_in_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		    "token_out_address": "0x8B1484d57abBE239bB280661377363b03c89CaEa",
		  },
		  {
		    "exact_quantity": "0x59248d08ad7aa00c5",
		    "id": "6a71443f0187d20a00efffffff0001001b",
		    "limit_quantity": "0x29710172",
		    "recipient_address": "0x18EE5d25cE9c738cF4c2A8F7628F936d6cC5EC61",
		    "router_address": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
		    "sender_address": "0x18EE5d25cE9c738cF4c2A8F7628F936d6cC5EC61",
		    "success": true,
		    "swap_type": "exact_input",
		    "token_in_address": "0x8B1484d57abBE239bB280661377363b03c89CaEa",
		    "token_out_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		  },
		]
	`);

	const b25678324 = await test_getBlock({ chain: 1, block_number: 25678324 });

	expect(event.handler(b25678324)).toMatchInlineSnapshot(`
		[
		  {
		    "exact_quantity": "0x64d31da1",
		    "id": "6a7143370187d1f40025ffffff0001001b",
		    "limit_quantity": "0x33dd62dc2772a00",
		    "recipient_address": "0x12D2b8ac38C59758a062a9f757F2740461779439",
		    "router_address": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
		    "sender_address": "0x12D2b8ac38C59758a062a9f757F2740461779439",
		    "success": true,
		    "swap_type": "exact_input",
		    "token_in_address": "0xD7EFB00d12C2c13131FD319336Fdf952525dA2af",
		    "token_out_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		  },
		  {
		    "exact_quantity": "0x88ebd979f1b4b000",
		    "id": "6a7143370187d1f400a9ffffff0001001b",
		    "limit_quantity": "0x25b4864",
		    "recipient_address": "0xfb13CF5020454F01eE24A0D38833093c2dd98189",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0xfb13CF5020454F01eE24A0D38833093c2dd98189",
		    "success": true,
		    "swap_type": "exact_input",
		    "token_in_address": "0x7e2ac793f3E692f388e66c7DC28F739d13B0B71A",
		    "token_out_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		  },
		  {
		    "exact_quantity": "0xf9288e3d8a20842f5",
		    "id": "6a7143370187d1f400ceffffff0001001b",
		    "limit_quantity": "0x459ccb2",
		    "recipient_address": "0x431f04DC9e0d07c41F4985997A99D4D310fF90Bd",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0x431f04DC9e0d07c41F4985997A99D4D310fF90Bd",
		    "success": true,
		    "swap_type": "exact_input",
		    "token_in_address": "0x99E980265Bf36516C442be982df1772a6cCb3233",
		    "token_out_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		  },
		]
	`);

	const b25678267 = await test_getBlock({ chain: 1, block_number: 25678267 });

	expect(event.handler(b25678267)).toMatchInlineSnapshot(`
		[
		  {
		    "exact_quantity": "0x25391ee35a05c54d000000",
		    "id": "6a71408b0187d1bb0051ffffff0001001b",
		    "limit_quantity": "0x12bc2a54a30c58c667",
		    "recipient_address": "0xB4897d49c5859B9bb5E3D6c4372BDd83d55c8D6c",
		    "router_address": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
		    "sender_address": "0xB4897d49c5859B9bb5E3D6c4372BDd83d55c8D6c",
		    "success": true,
		    "swap_type": "exact_output",
		    "token_in_address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
		    "token_out_address": "0xA882606494D86804B5514E07e6Bd2D6a6eE6d68A",
		  },
		]
	`);

	const b25678351 = await test_getBlock({ chain: 1, block_number: 25678351 });

	expect(event.handler(b25678351)).toMatchInlineSnapshot(`
		[
		  {
		    "exact_quantity": "0x3bc2b2b2868c7",
		    "id": "6a71447b0187d20f0037ffffff0001001b",
		    "limit_quantity": "0x0",
		    "recipient_address": "0xd32f19caacFA558bd5864464E4d7560306D9fE3E",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0xd32f19caacFA558bd5864464E4d7560306D9fE3E",
		    "success": true,
		    "swap_type": "exact_input",
		    "token_in_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		    "token_out_address": "0x95AF4aF910c28E8EcE4512BFE46F1F33687424ce",
		  },
		  {
		    "exact_quantity": "0x1ae805eefa1dc",
		    "id": "6a71447b0187d20f0038ffffff0001001b",
		    "limit_quantity": "0x0",
		    "recipient_address": "0x0eE4B7145741616E37bc04Cf6ae38a1e73cc4915",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0x0eE4B7145741616E37bc04Cf6ae38a1e73cc4915",
		    "success": true,
		    "swap_type": "exact_input",
		    "token_in_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		    "token_out_address": "0x95AF4aF910c28E8EcE4512BFE46F1F33687424ce",
		  },
		  {
		    "exact_quantity": "0x47608d3059f0f",
		    "id": "6a71447b0187d20f003affffff0001001b",
		    "limit_quantity": "0x0",
		    "recipient_address": "0x934eB981c5745DE39CC36Fb0BBCfcEbcA4cF76e2",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0x934eB981c5745DE39CC36Fb0BBCfcEbcA4cF76e2",
		    "success": true,
		    "swap_type": "exact_input",
		    "token_in_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		    "token_out_address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
		  },
		  {
		    "exact_quantity": "0x5fc",
		    "id": "6a71447b0187d20f003fffffff0001001b",
		    "limit_quantity": "0xc7adff51a5f4",
		    "recipient_address": "0x2FEF0275663a8dEe208c5e5E88c81630De8359E8",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0x2FEF0275663a8dEe208c5e5E88c81630De8359E8",
		    "success": true,
		    "swap_type": "exact_input",
		    "token_in_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		    "token_out_address": "0x8B1484d57abBE239bB280661377363b03c89CaEa",
		  },
		  {
		    "exact_quantity": "0x1737c715db8c0",
		    "id": "6a71447b0187d20f0040ffffff0001001b",
		    "limit_quantity": "0x0",
		    "recipient_address": "0x9b056E2fd1b96A5d2494a303daCCE77200F61B96",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0x9b056E2fd1b96A5d2494a303daCCE77200F61B96",
		    "success": true,
		    "swap_type": "exact_input",
		    "token_in_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		    "token_out_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		  },
		]
	`);

	const b25677874 = await test_getBlock({ chain: 1, block_number: 25677874 });

	expect(event.handler(b25677874)).toMatchInlineSnapshot(`
		[
		  {
		    "exact_quantity": "0x85209bb78025d",
		    "id": "6a712e130187d032002bffffff0001001b",
		    "limit_quantity": "0x0",
		    "recipient_address": "0x784b9ff6c133c55b0fBE09E5271Aa9884e12ff3e",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0x784b9ff6c133c55b0fBE09E5271Aa9884e12ff3e",
		    "success": true,
		    "swap_type": "exact_input",
		    "token_in_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		    "token_out_address": "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
		  },
		  {
		    "exact_quantity": "0x470de4df820000",
		    "id": "6a712e130187d0320041ffffff0001001b",
		    "limit_quantity": "0x2ba8e49f45377400000",
		    "recipient_address": "0xF5c299316699131d29Adcb7eF87AF8E97bbC7eAD",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0xF5c299316699131d29Adcb7eF87AF8E97bbC7eAD",
		    "success": true,
		    "swap_type": "exact_input",
		    "token_in_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		    "token_out_address": "0x8e729198d1C59B82bd6bBa579310C40d740A11C2",
		  },
		]
	`);

	const b25677937 = await test_getBlock({ chain: 1, block_number: 25677937 });

	expect(event.handler(b25677937)).toMatchInlineSnapshot(`
		[
		  {
		    "exact_quantity": "0x144fa40402733637d900",
		    "id": "6a7131070187d07101eeffffff0001001b",
		    "limit_quantity": "0xbd2dde353d4e17",
		    "recipient_address": "0xbE11308E8631c271E7C3892d7C327B5b0984Afbe",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0xbE11308E8631c271E7C3892d7C327B5b0984Afbe",
		    "success": true,
		    "swap_type": "exact_output",
		    "token_in_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		    "token_out_address": "0x6B0b3a982b4634aC68dD83a4DBF02311cE324181",
		  },
		]
	`);

	const b25676459 = await test_getBlock({ chain: 1, block_number: 25676459 });

	expect(event.handler(b25676459)).toMatchInlineSnapshot(`
		[
		  {
		    "exact_quantity": "0xee6b280",
		    "id": "6a70eba70187caab0015ffffff0001001b",
		    "limit_quantity": "0x103ed423771d9700000",
		    "recipient_address": "0x6F858f383842c887A82d30b392Cfc686938413eC",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0x6F858f383842c887A82d30b392Cfc686938413eC",
		    "success": true,
		    "swap_type": "exact_output",
		    "token_in_address": "0xFeAc2Eae96899709a43E252B6B92971D32F9C0F9",
		    "token_out_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		  },
		  {
		    "exact_quantity": "0x1a5dcf1d93269d80000",
		    "id": "6a70eba70187caab010cffffff0001001b",
		    "limit_quantity": "0x17e65e4a",
		    "recipient_address": "0xca02F1b7CAC7f352597699D973F12F95Cc8Cf6F0",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0xca02F1b7CAC7f352597699D973F12F95Cc8Cf6F0",
		    "success": true,
		    "swap_type": "exact_input",
		    "token_in_address": "0xFeAc2Eae96899709a43E252B6B92971D32F9C0F9",
		    "token_out_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		  },
		  {
		    "exact_quantity": "0x1c18cf0ae982",
		    "id": "6a70eba70187caab0145ffffff0001001b",
		    "limit_quantity": "0x1882d2e210e762000",
		    "recipient_address": "0x4dEb7488220c0610649E14d5c316f982B9eE27B6",
		    "router_address": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
		    "sender_address": "0x4dEb7488220c0610649E14d5c316f982B9eE27B6",
		    "success": true,
		    "swap_type": "exact_input",
		    "token_in_address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		    "token_out_address": "0x6112C3509A8a787df576028450FebB3786A2274d",
		  },
		]
	`);
});

test.concurrent("intent_uniswap_v3_swap_v1 includes failed submissions", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 25678351 });

	const failed = {
		...block,

		eth_getBlockReceipts: block.eth_getBlockReceipts.map((receipt) => {
			if (receipt.transactionHash !== "0x1d76631777fe211aa5040dea180e1c46262e5433c9def34a9e7b905a6fca9ce5") {
				return receipt;
			}

			return {
				...receipt,
				status: "0x0" as const,
			};
		}),
	};

	expect(event.handler(failed).map((event) => ({ id: event.id, success: event.success }))).toMatchInlineSnapshot(`
		[
		  {
		    "id": "6a71447b0187d20f0037ffffff0001001b",
		    "success": true,
		  },
		  {
		    "id": "6a71447b0187d20f0038ffffff0001001b",
		    "success": true,
		  },
		  {
		    "id": "6a71447b0187d20f003affffff0001001b",
		    "success": true,
		  },
		  {
		    "id": "6a71447b0187d20f003fffffff0001001b",
		    "success": true,
		  },
		  {
		    "id": "6a71447b0187d20f0040ffffff0001001b",
		    "success": false,
		  },
		]
	`);
});
