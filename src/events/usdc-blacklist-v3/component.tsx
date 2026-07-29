import { getAddress, isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { UsdcBlacklistV3 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import type { Account as IAccount } from "@/state/account";

const USDC_ADDRESS = getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");

export function UsdcBlacklistV3Description(props: { event: UsdcBlacklistV3 }) {
	const chain = parseId(props.event.id).chainId;

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Erc20 chain={chain} address={USDC_ADDRESS} />
			<Action type="blacklisted">blacklisted</Action>
			<Account chain={chain} address={props.event.account_address} />
		</Description>
	);
}

export function UsdcBlacklistV3AccountDescription(props: { event: UsdcBlacklistV3; account: IAccount }) {
	const chain = parseId(props.event.id).chainId;

	// 1. From the perspective of the blacklisted account

	if (isAddressEqual(props.account.address, props.event.account_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="blacklisted">Blacklisted</Action>
				<span>by</span>
				<Erc20 chain={chain} address={USDC_ADDRESS} />
			</Description>
		);
	}

	// 2. From the perspective of USDC

	if (isAddressEqual(props.account.address, USDC_ADDRESS)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="blacklisted">Blacklisted</Action>
				<Account chain={chain} address={props.event.account_address} />
			</Description>
		);
	}

	return <UsdcBlacklistV3Description event={props.event} />;
}
