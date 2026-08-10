import { test } from "vitest";

import { event, getLogErc20ApprovalV1 } from "./event";
import { test_getBlock, test_client } from "@/tests/utils";

test.concurrent("log_erc20_approval_v1", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10000000 });

	await event.storage.delete(event.handler(block));

	const ids = event.handler(block).map((event) => event.id);

	const initial = await getLogErc20ApprovalV1(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"log_erc20_approval_v1", //
					"log_erc20_approval_v1_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const events = await getLogErc20ApprovalV1(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "id": "5eb017050098968000180000100001000b",
		    "owner_address": "0xBCE5FE052B25E422550f6012FDD1941F9353f001",
		    "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "log_erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb017050098968000190000270001000b",
		    "owner_address": "0x1f52775214e2B3d099eB82b6e9e9025c490157ad",
		    "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "log_erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb0170500989680001a0000290001000b",
		    "owner_address": "0x2858e866C5fdCefeA13Bedf13948A785b5C8b040",
		    "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "log_erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb0170500989680001b00002b0001000b",
		    "owner_address": "0x903171964EE615Dc99F350bd29ea747B887aE3F4",
		    "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "log_erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb0170500989680001c00002f0001000b",
		    "owner_address": "0x798bE9b2AdfcA455c78fB648ec11538C0964F69d",
		    "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "log_erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb0170500989680001d0000310001000b",
		    "owner_address": "0x445328c3b205Ea0415a9e8fB6EA8E4C5D2dB6B2e",
		    "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "log_erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb0170500989680001e0000350001000b",
		    "owner_address": "0x657FbEEe7214758a72e3139EC0d04b162e274814",
		    "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "log_erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb0170500989680001f0000370001000b",
		    "owner_address": "0x425a488128aF3eD04886AA4220b58C145601f23f",
		    "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "log_erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb017050098968000200000390001000b",
		    "owner_address": "0xae3703814FD2658EA0AE7da11fed10047ae89c49",
		    "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "log_erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb0170500989680002100003d0001000b",
		    "owner_address": "0x685dB7892a33cD919774eEA104f1B3cfD25f470E",
		    "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "log_erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb0170500989680002200003f0001000b",
		    "owner_address": "0xD4d64d331281e5CFeD11FCfb23882A3eE946289F",
		    "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "log_erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb0170500989680004f0000750001000b",
		    "owner_address": "0x09e80bdE912794fdbEA1e5B68B0C37A346b73cfC",
		    "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		    "spender_address": "0x882d80D3a191859d64477eb78Cca46599307ec1C",
		    "success": true,
		    "tag": "log_erc20_approval_v1",
		    "token_address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
		  },
		  {
		    "id": "5eb017050098968000500000760001000b",
		    "owner_address": "0x09e80bdE912794fdbEA1e5B68B0C37A346b73cfC",
		    "quantity": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		    "spender_address": "0x882d80D3a191859d64477eb78Cca46599307ec1C",
		    "success": true,
		    "tag": "log_erc20_approval_v1",
		    "token_address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
		  },
		]
	`);
});
