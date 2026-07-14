import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { ContractDeploymentV2 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import type { Account as IAccount } from "@/state/account";

export function ContractDeploymentV2Description(props: { event: ContractDeploymentV2 }) {
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

export function ContractDeploymentV2AccountDescription(props: { event: ContractDeploymentV2; account: IAccount }) {
	const chain = parseId(props.event.id).chainId;

	if (isAddressEqual(props.account.address, props.event.deployer_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="deployed">Deployed</Action>
				<span>contract</span>
				<Account chain={chain} address={props.event.contract_address} />
			</Description>
		);
	}

	if (isAddressEqual(props.account.address, props.event.contract_address)) {
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

	return <ContractDeploymentV2Description event={props.event} />;
}
