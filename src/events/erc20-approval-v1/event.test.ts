import { test } from "vitest";

import { getErc20ApprovalV1 } from "./event";
import { test_deleteEvents, test_getBlock, test_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("erc20_approval_v1", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 10000000 });

	await test_deleteEvents(block, "event_erc20_approval_v1");

	const response = await test_writeEvents(block, "erc20_approval_v1");

	expect(response.error).toBeUndefined();
	expect(response.result).toMatchObject({ failures: [] });

	const ids = await test_getEventIdsForBlock(block, "event_erc20_approval_v1");

	const events = await getErc20ApprovalV1(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "id": "5eb01705-0098-9680-0018-001000010002",
		    "owner_address": "0xBCE5FE052B25E422550f6012FDD1941F9353f001",
		    "quantity": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb01705-0098-9680-0019-002700010002",
		    "owner_address": "0x1f52775214e2B3d099eB82b6e9e9025c490157ad",
		    "quantity": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb01705-0098-9680-001a-002900010002",
		    "owner_address": "0x2858e866C5fdCefeA13Bedf13948A785b5C8b040",
		    "quantity": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb01705-0098-9680-001b-002b00010002",
		    "owner_address": "0x903171964EE615Dc99F350bd29ea747B887aE3F4",
		    "quantity": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb01705-0098-9680-001c-002f00010002",
		    "owner_address": "0x798bE9b2AdfcA455c78fB648ec11538C0964F69d",
		    "quantity": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb01705-0098-9680-001d-003100010002",
		    "owner_address": "0x445328c3b205Ea0415a9e8fB6EA8E4C5D2dB6B2e",
		    "quantity": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb01705-0098-9680-001e-003500010002",
		    "owner_address": "0x657FbEEe7214758a72e3139EC0d04b162e274814",
		    "quantity": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb01705-0098-9680-001f-003700010002",
		    "owner_address": "0x425a488128aF3eD04886AA4220b58C145601f23f",
		    "quantity": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb01705-0098-9680-0020-003900010002",
		    "owner_address": "0xae3703814FD2658EA0AE7da11fed10047ae89c49",
		    "quantity": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb01705-0098-9680-0021-003d00010002",
		    "owner_address": "0x685dB7892a33cD919774eEA104f1B3cfD25f470E",
		    "quantity": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb01705-0098-9680-0022-003f00010002",
		    "owner_address": "0xD4d64d331281e5CFeD11FCfb23882A3eE946289F",
		    "quantity": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
		    "spender_address": "0x8A91C9A16cD62693649D80Afa85A09DBBdCb8508",
		    "success": true,
		    "tag": "erc20_approval_v1",
		    "token_address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
		  },
		  {
		    "id": "5eb01705-0098-9680-004f-007500010002",
		    "owner_address": "0x09e80bdE912794fdbEA1e5B68B0C37A346b73cfC",
		    "quantity": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
		    "spender_address": "0x882d80D3a191859d64477eb78Cca46599307ec1C",
		    "success": true,
		    "tag": "erc20_approval_v1",
		    "token_address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
		  },
		  {
		    "id": "5eb01705-0098-9680-0050-007600010002",
		    "owner_address": "0x09e80bdE912794fdbEA1e5B68B0C37A346b73cfC",
		    "quantity": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
		    "spender_address": "0x882d80D3a191859d64477eb78Cca46599307ec1C",
		    "success": true,
		    "tag": "erc20_approval_v1",
		    "token_address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
		  },
		]
	`);
});
