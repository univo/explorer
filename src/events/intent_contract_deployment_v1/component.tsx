import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { IntentContractDeploymentV1 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";

export function IntentContractDeploymentV1Description(props: { event: IntentContractDeploymentV1 }) {
	const chain = parseId(props.event.id).chainId;

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.deployer_address} />
			<Action type="deployed">deployed</Action>
			<span>contract</span>
			<Account chain={chain} address={props.event.contract_address} />
		</Description>
	);
}

export function IntentContractDeploymentV1AccountDescription(props: {
	event: IntentContractDeploymentV1;
	address: `0x${string}`;
}) {
	const chain = parseId(props.event.id).chainId;

	if (isAddressEqual(props.address, props.event.deployer_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="deployed">Deployed</Action>
				<span>contract</span>
				<Account chain={chain} address={props.event.contract_address} />
			</Description>
		);
	}

	if (isAddressEqual(props.address, props.event.contract_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<span>Contract</span>
				<Action type="deployed">deployed</Action>
				<span>by</span>
				<Account chain={chain} address={props.event.deployer_address} />
			</Description>
		);
	}

	return <IntentContractDeploymentV1Description event={props.event} />;
}
