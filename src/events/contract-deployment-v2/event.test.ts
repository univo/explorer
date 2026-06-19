import { test } from "vitest";

import { getContractDeploymentV2 } from "./event";
import { test_deleteEvents, test_getBlock, test_v2_getEventIdsForBlock, test_writeEvents } from "@/tests/utils";

test.concurrent("contract_deployment_v2", async ({ expect }) => {
	const block = await test_getBlock({ chain: 1, block_number: 3978343 });

	await test_deleteEvents(block, "event_contract_deployment_v2");

	await test_writeEvents(block, "contract_deployment_v2");

	const ids = await test_v2_getEventIdsForBlock(block, "event_contract_deployment_v2");
	const events = await getContractDeploymentV2(ids);

	expect(events).toHaveLength(4);
	expect(events).toEqual(
		expect.arrayContaining([
			{
				contract_address: "0xd7f207a6bbb6b9e41b1f46df8174ed9340e3907d",
				deployer_address: "0x174443351e21d47ed9ab51517a301107d92ede64",
				id: "595cf83c003cb467000300000001000d",
				success: true,
				tag: "contract_deployment_v2",
			},
			{
				contract_address: "0xb8c77482e45f1f44de1745f52c74426c631bdd52",
				deployer_address: "0x00c5e04176d95a286fcce0e68c683ca0bfec8454",
				id: "595cf83c003cb467002c00000001000d",
				success: true,
				tag: "contract_deployment_v2",
			},
		]),
	);
});
