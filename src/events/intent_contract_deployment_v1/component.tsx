import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { isHexEqual, unreachable } from "@/utils";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import type { IntentContractDeploymentV1 } from "./event";

export function IntentContractDeploymentV1AccountDescription(props: { event: IntentContractDeploymentV1; address: `0x${string}` }) {
	const chain = parseId(props.event.id).chainId;

	// (tx.from) deployer_address

	if (isHexEqual(props.address, props.event.deployer_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="deployed">Deploy</Action>
				<span>contract</span>
				<Account chain={chain} address={props.event.contract_address} />
			</Description>
		);
	}

	// contract_address

	if (isHexEqual(props.address, props.event.contract_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="deployed">Deploy</Action>
				<span>contract by</span>
				<Account chain={chain} address={props.event.deployer_address} />
			</Description>
		);
	}

	unreachable();
}
