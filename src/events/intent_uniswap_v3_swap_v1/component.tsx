import { Fragment } from "react";

import { parseId } from "@/helpers";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { isHexEqual, unreachable } from "@/utils";
import type { IntentUniswapV3SwapV1 } from "./event";
import { Description } from "@/components/description";

export function IntentUniswapV3SwapV1AccountDescription(props: { event: IntentUniswapV3SwapV1; address: `0x${string}` }) {
	const { chainId: chain } = parseId(props.event.id);

	// (tx.from) sender_address: the account performing the swap

	if (isHexEqual(props.address, props.event.sender_address)) {
		if (isHexEqual(props.event.sender_address, props.event.recipient_address)) {
			return (
				<Description success={props.event.success}>
					<Action type="swapped">Swap</Action>
					<Amounts event={props.event} />
					<span>via</span>
					<Account chain={chain} address={props.event.router_address} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Action type="swapped">Swap</Action>
				<Amounts event={props.event} />
				<span>with recipient</span>
				<Account chain={chain} address={props.event.recipient_address} />
				<span>via</span>
				<Account chain={chain} address={props.event.router_address} />
			</Description>
		);
	}

	// recipient_address: the account receiving the funds. To get here means we are not the sender
	// and just received the funds

	if (isHexEqual(props.address, props.event.recipient_address)) {
		return (
			<Description>
				<Account chain={chain} address={props.event.sender_address} />
				<Action type="swapped">swaps</Action>
				<Amounts event={props.event} />
				<span>via</span>
				<Account chain={chain} address={props.event.router_address} />
				<span>with this account as the recipient of the funds</span>
			</Description>
		);
	}

	// (tx.to) router_address

	if (isHexEqual(props.address, props.event.router_address)) {
		if (isHexEqual(props.event.sender_address, props.event.recipient_address)) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.sender_address} />
					<Action type="swapped">swaps</Action>
					<Amounts event={props.event} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.sender_address} />
				<Action type="swapped">swaps</Action>
				<Amounts event={props.event} />
				<span>with recipient</span>
				<Account chain={chain} address={props.event.recipient_address} />
			</Description>
		);
	}

	// token_in_address

	if (isHexEqual(props.address, props.event.token_in_address)) {
		if (isHexEqual(props.event.sender_address, props.event.recipient_address)) {
			return (
				<Description>
					<Account chain={chain} address={props.event.sender_address} />
					<Action type="swapped">swaps</Action>
					<Amounts event={props.event} />
					<span>via</span>
					<Account chain={chain} address={props.event.router_address} />
				</Description>
			);
		}

		return (
			<Description>
				<Account chain={chain} address={props.event.sender_address} />
				<Action type="swapped">swaps</Action>
				<Amounts event={props.event} />
				<span>via</span>
				<Account chain={chain} address={props.event.router_address} />
				<span>with recipient</span>
				<Account chain={chain} address={props.event.recipient_address} />
			</Description>
		);
	}

	// token_out_address

	if (isHexEqual(props.address, props.event.token_out_address)) {
		if (isHexEqual(props.event.sender_address, props.event.recipient_address)) {
			return (
				<Description>
					<Account chain={chain} address={props.event.sender_address} />
					<Action type="sold">swaps</Action>
					<Amounts event={props.event} />
					<span>via</span>
					<Account chain={chain} address={props.event.router_address} />
				</Description>
			);
		}

		return (
			<Description>
				<Account chain={chain} address={props.event.sender_address} />
				<Action type="sold">swaps</Action>
				<Amounts event={props.event} />
				<span>via</span>
				<Account chain={chain} address={props.event.router_address} />
				<span>with recipient</span>
				<Account chain={chain} address={props.event.recipient_address} />
			</Description>
		);
	}

	unreachable();
}

function Amounts(props: { event: IntentUniswapV3SwapV1 }) {
	// Normally I avoid creating these utility components and prefer simple top level if branches,
	// but in this case it's worth it and doesn't double the size of our branches above

	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	if (props.event.swap_type === "exact_input") {
		return (
			<Fragment>
				<Erc20 chain={chain} address={props.event.token_in_address} quantity={props.event.exact_quantity} at={blockTimestamp} />
				<span>for at least</span>
				<Erc20 chain={chain} address={props.event.token_out_address} quantity={props.event.limit_quantity} at={blockTimestamp} />
			</Fragment>
		);
	}

	return (
		<Fragment>
			<span>up to</span>
			<Erc20 chain={chain} address={props.event.token_in_address} quantity={props.event.limit_quantity} at={blockTimestamp} />
			<span>for exactly</span>
			<Erc20 chain={chain} address={props.event.token_out_address} quantity={props.event.exact_quantity} at={blockTimestamp} />
		</Fragment>
	);
}
