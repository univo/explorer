import { test } from "vitest";

import { event, getIntentContractDeploymentV2 } from "./event";
import { test_getBlock, test_client } from "@/tests/utils";

test.concurrent("intent_contract_deployment_v2 deletes, writes, and reads from storage", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 3978343 });

	const handled = event.handler(block);

	await event.storage.delete(handled);

	const ids = handled.map((event) => event.id);

	const initial = await getIntentContractDeploymentV2(ids);

	expect(initial).toStrictEqual([]);

	await test_client.request({
		method: "private_writeEvents",
		params: [
			{
				blocks: [block],
				events: [
					"intent_contract_deployment_v2",
					"intent_contract_deployment_v2_index_account_v4",
					"intent_contract_deployment_v2_index_block_number_tx_index_v4",
				],
			},
		],
	});

	const events = await getIntentContractDeploymentV2(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "block_number": 3978343,
		    "block_timestamp": 2017-07-05T14:31:24.000Z,
		    "chain": 1,
		    "contract_address": "0xD7f207A6BBb6B9E41b1F46dF8174ED9340E3907d",
		    "deployer_address": "0x174443351E21D47Ed9aB51517A301107d92eDe64",
		    "id": "595cf83c003cb4670003ffffff00010044",
		    "log_index": 16777215,
		    "success": true,
		    "tag": "intent_contract_deployment_v2",
		    "tx_index": 3,
		  },
		  {
		    "block_number": 3978343,
		    "block_timestamp": 2017-07-05T14:31:24.000Z,
		    "chain": 1,
		    "contract_address": "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
		    "deployer_address": "0x00C5E04176d95A286fccE0E68c683Ca0bfec8454",
		    "id": "595cf83c003cb467002cffffff00010044",
		    "log_index": 16777215,
		    "success": true,
		    "tag": "intent_contract_deployment_v2",
		    "tx_index": 44,
		  },
		  {
		    "block_number": 3978343,
		    "block_timestamp": 2017-07-05T14:31:24.000Z,
		    "chain": 1,
		    "contract_address": "0xA51e790658F36B025dce56EE957D7C65985b0ab6",
		    "deployer_address": "0x174443351E21D47Ed9aB51517A301107d92eDe64",
		    "id": "595cf83c003cb4670057ffffff00010044",
		    "log_index": 16777215,
		    "success": true,
		    "tag": "intent_contract_deployment_v2",
		    "tx_index": 87,
		  },
		  {
		    "block_number": 3978343,
		    "block_timestamp": 2017-07-05T14:31:24.000Z,
		    "chain": 1,
		    "contract_address": "0xA12DE48e633dDB7A92A96281Bc6F11fA0A9f9015",
		    "deployer_address": "0x174443351E21D47Ed9aB51517A301107d92eDe64",
		    "id": "595cf83c003cb467005dffffff00010044",
		    "log_index": 16777215,
		    "success": true,
		    "tag": "intent_contract_deployment_v2",
		    "tx_index": 93,
		  },
		]
	`);
});
