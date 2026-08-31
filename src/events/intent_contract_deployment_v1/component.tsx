import { parseId } from "@/helpers";
import { isHexEqual } from "@/utils";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { Description } from "@/components/description";
import type { IntentContractDeploymentV1 } from "./event";

export function IntentContractDeploymentV1AccountDescription(props: {
	event: IntentContractDeploymentV1;
	address: `0x${string}` | undefined;
}) {
	const chain = parseId(props.event.id).chainId;

	// (tx.from) deployer_address

	if (isHexEqual(props.address, props.event.deployer_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="deploy">Deploy</Action>
				<span>contract</span>
				<Account chain={chain} address={props.event.contract_address} />
			</Description>
		);
	}

	// contract_address

	if (isHexEqual(props.address, props.event.contract_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="deploy">Deploy</Action>
				<span>contract by</span>
				<Account chain={chain} address={props.event.deployer_address} />
			</Description>
		);
	}

	return (
		<Description success={props.event.success}>
			<Action type="deploy">Deploy</Action>
			<Account chain={chain} address={props.event.contract_address} />
			<span>by</span>
			<Account chain={chain} address={props.event.deployer_address} />
		</Description>
	);
}
