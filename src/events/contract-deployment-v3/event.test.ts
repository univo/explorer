import { test } from "vitest";

import { event, getContractDeploymentV3 } from "./event";
import { test_getBlock, test_client } from "@/tests/utils";

test.concurrent("contract_deployment_v3", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 3978343 });

	await event.storage.delete(event.handler(block));

	const ids = event.handler(block).map((event) => event.id);

	const initial = await getContractDeploymentV3(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"contract_deployment_v3",
					"contract_deployment_v3_index_account_v3",
					"contract_deployment_v3_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const events = await getContractDeploymentV3(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "contract_address": "0xD7f207A6BBb6B9E41b1F46dF8174ED9340E3907d",
		    "deployer_address": "0x174443351E21D47Ed9aB51517A301107d92eDe64",
		    "id": "595cf83c003cb46700030000000001000d",
		    "success": true,
		    "tag": "contract_deployment_v3",
		  },
		  {
		    "contract_address": "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
		    "deployer_address": "0x00C5E04176d95A286fccE0E68c683Ca0bfec8454",
		    "id": "595cf83c003cb467002c0000000001000d",
		    "success": true,
		    "tag": "contract_deployment_v3",
		  },
		  {
		    "contract_address": "0xA51e790658F36B025dce56EE957D7C65985b0ab6",
		    "deployer_address": "0x174443351E21D47Ed9aB51517A301107d92eDe64",
		    "id": "595cf83c003cb46700570000000001000d",
		    "success": true,
		    "tag": "contract_deployment_v3",
		  },
		  {
		    "contract_address": "0xA12DE48e633dDB7A92A96281Bc6F11fA0A9f9015",
		    "deployer_address": "0x174443351E21D47Ed9aB51517A301107d92eDe64",
		    "id": "595cf83c003cb467005d0000000001000d",
		    "success": true,
		    "tag": "contract_deployment_v3",
		  },
		]
	`);
});
