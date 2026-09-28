import { isHexEqual } from "@/utils";
import { Action } from "@/components/action";
import { getExternalChain } from "@/helpers";
import { Account } from "@/components/account";
import { Description } from "@/components/description";
import type { IntentContractDeploymentV2 } from "./event";

export function IntentContractDeploymentV2AccountDescription(props: {
	event: IntentContractDeploymentV2;
	address: `0x${string}` | undefined;
}) {
	const chain = getExternalChain(props.event.chain);

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
