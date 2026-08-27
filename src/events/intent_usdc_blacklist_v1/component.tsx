import { getAddress } from "viem";

import { parseId } from "@/helpers";
import { isHexEqual } from "@/utils";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { IntentUsdcBlacklistV1 } from "./event";
import { Description } from "@/components/description";

const USDC_ADDRESS = getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");

export function IntentUsdcBlacklistV1AccountDescription(props: { event: IntentUsdcBlacklistV1; address: `0x${string}` }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	// account_address

	if (isHexEqual(props.address, props.event.account_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="blacklist">Blacklist</Action>
				<span>account from transferring any</span>
				<Erc20 chain={chain} address={USDC_ADDRESS} at={blockTimestamp} />
			</Description>
		);
	}

	// USDC_ADDRESS

	if (isHexEqual(props.address, USDC_ADDRESS)) {
		return (
			<Description success={props.event.success}>
				<Action type="blacklist">Blacklist</Action>
				<Account chain={chain} address={props.event.account_address} />
				<span>from transferring any tokens</span>
			</Description>
		);
	}

	// (tx.from) not actually supported at the event level, usually some authorized EOA, we should
	// probably have included this in the event data.

	return (
		<Description success={props.event.success}>
			<Account chain={chain} address={USDC_ADDRESS} />
			<Action type="blacklist">blacklists</Action>
			<Account chain={chain} address={props.event.account_address} />
			<span>from transferring any tokens</span>
		</Description>
	);
}
