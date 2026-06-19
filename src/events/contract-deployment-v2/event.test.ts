import { test } from "vitest";

import { getContractDeploymentV2 } from "./event";
import { test_v2_deleteEvents, test_getBlock, test_v2_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("contract_deployment_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 3978343 });

	await test_v2_deleteEvents(block, "event_contract_deployment_v2");

	await test_writeEvents(block, "contract_deployment_v2");

	const ids = await test_v2_getEventIdsForBlock(block, "event_contract_deployment_v2");
	const events = await getContractDeploymentV2(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "contract_address": "0xD7f207A6BBb6B9E41b1F46dF8174ED9340E3907d",
		    "deployer_address": "0x174443351E21D47Ed9aB51517A301107d92eDe64",
		    "id": "595cf83c003cb467000300000001000d",
		    "success": true,
		    "tag": "contract_deployment_v2",
		  },
		  {
		    "contract_address": "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
		    "deployer_address": "0x00C5E04176d95A286fccE0E68c683Ca0bfec8454",
		    "id": "595cf83c003cb467002c00000001000d",
		    "success": true,
		    "tag": "contract_deployment_v2",
		  },
		  {
		    "contract_address": "0xA51e790658F36B025dce56EE957D7C65985b0ab6",
		    "deployer_address": "0x174443351E21D47Ed9aB51517A301107d92eDe64",
		    "id": "595cf83c003cb467005700000001000d",
		    "success": true,
		    "tag": "contract_deployment_v2",
		  },
		  {
		    "contract_address": "0xA12DE48e633dDB7A92A96281Bc6F11fA0A9f9015",
		    "deployer_address": "0x174443351E21D47Ed9aB51517A301107d92eDe64",
		    "id": "595cf83c003cb467005d00000001000d",
		    "success": true,
		    "tag": "contract_deployment_v2",
		  },
		]
	`);
});
