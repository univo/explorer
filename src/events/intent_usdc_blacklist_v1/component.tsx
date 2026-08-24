import { getAddress, isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { IntentUsdcBlacklistV1 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";

const USDC_ADDRESS = getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");

export function IntentUsdcBlacklistV1Description(props: { event: IntentUsdcBlacklistV1 }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Erc20 chain={chain} address={USDC_ADDRESS} at={blockTimestamp} />
			<Action type="blacklisted">blacklisted</Action>
			<Account chain={chain} address={props.event.account_address} />
		</Description>
	);
}

export function IntentUsdcBlacklistV1AccountDescription(props: {
	event: IntentUsdcBlacklistV1;
	address: `0x${string}`;
}) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	// 1. From the perspective of the blacklisted account

	if (isAddressEqual(props.address, props.event.account_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="blacklisted">Blacklist</Action>
				<span>account from transferring any</span>
				<Erc20 chain={chain} address={USDC_ADDRESS} at={blockTimestamp} />
			</Description>
		);
	}

	// 2. From the perspective of USDC

	if (isAddressEqual(props.address, USDC_ADDRESS)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="blacklisted">Blacklist</Action>
				<Account chain={chain} address={props.event.account_address} />
				<span>from transferring any tokens</span>
			</Description>
		);
	}

	return <IntentUsdcBlacklistV1Description event={props.event} />;
}
