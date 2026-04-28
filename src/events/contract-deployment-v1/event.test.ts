import { test } from "vitest";

import { getContractDeploymentV1 } from "./event";
import { test_deleteEvents, test_getBlock, test_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("contract_deployment_v1", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 3978343 });

	await test_deleteEvents(block, "event_contract_deployment_v1");

	const response = await test_writeEvents(block, "contract_deployment_v1");

	expect(response.error).toBeUndefined();
	expect(response.result).toMatchObject({ failures: [] });

	const ids = await test_getEventIdsForBlock(block, "event_contract_deployment_v1");

	const events = await getContractDeploymentV1(ids);

	expect(events).toMatchInlineSnapshot(`
		[
		  {
		    "contract_address": "0xD7f207A6BBb6B9E41b1F46dF8174ED9340E3907d",
		    "deployer_address": "0x174443351E21D47Ed9aB51517A301107d92eDe64",
		    "id": "595cf83c-003c-b467-0003-000000010004",
		    "success": true,
		    "tag": "contract_deployment_v1",
		  },
		  {
		    "contract_address": "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
		    "deployer_address": "0x00C5E04176d95A286fccE0E68c683Ca0bfec8454",
		    "id": "595cf83c-003c-b467-002c-000000010004",
		    "success": true,
		    "tag": "contract_deployment_v1",
		  },
		  {
		    "contract_address": "0xA51e790658F36B025dce56EE957D7C65985b0ab6",
		    "deployer_address": "0x174443351E21D47Ed9aB51517A301107d92eDe64",
		    "id": "595cf83c-003c-b467-0057-000000010004",
		    "success": true,
		    "tag": "contract_deployment_v1",
		  },
		  {
		    "contract_address": "0xA12DE48e633dDB7A92A96281Bc6F11fA0A9f9015",
		    "deployer_address": "0x174443351E21D47Ed9aB51517A301107d92eDe64",
		    "id": "595cf83c-003c-b467-005d-000000010004",
		    "success": true,
		    "tag": "contract_deployment_v1",
		  },
		]
	`);
});
