import { parseId } from "@/helpers";
import { isHexEqual } from "@/utils";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { ExclamationIcon } from "@/components/icons";
import type { IntentUniswapV3SwapV1 } from "./event";
import { Description } from "@/components/description";

export function IntentUniswapV3SwapV1Description(props: { event: IntentUniswapV3SwapV1 }) {
	const chain = parseId(props.event.id).chainId;

	if (props.event.swap_type === "exact_input") {
		if (isHexEqual(props.event.sender_address, props.event.recipient_address)) {
			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Account chain={chain} address={props.event.sender_address} />
					<Action type="swapped">swapped</Action>
					<Erc20 chain={chain} address={props.event.token_in_address} quantity={props.event.exact_quantity} />
					<span>for at least</span>
					<Erc20 chain={chain} address={props.event.token_out_address} quantity={props.event.limit_quantity} />
					<span>via</span>
					<Account chain={chain} address={props.event.router_address} />
				</Description>
			);
		}

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.sender_address} />
				<Action type="swapped">swapped</Action>
				<Erc20 chain={chain} address={props.event.token_in_address} quantity={props.event.exact_quantity} />
				<span>for at least</span>
				<Erc20 chain={chain} address={props.event.token_out_address} quantity={props.event.limit_quantity} />
				<span>with recipient</span>
				<Account chain={chain} address={props.event.recipient_address} />
				<span>via</span>
				<Account chain={chain} address={props.event.router_address} />
			</Description>
		);
	}

	if (isHexEqual(props.event.sender_address, props.event.recipient_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.sender_address} />
				<Action type="swapped">swapped</Action>
				<span>up to</span>
				<Erc20 chain={chain} address={props.event.token_in_address} quantity={props.event.limit_quantity} />
				<span>for exactly</span>
				<Erc20 chain={chain} address={props.event.token_out_address} quantity={props.event.exact_quantity} />
				<span>via</span>
				<Account chain={chain} address={props.event.router_address} />
			</Description>
		);
	}

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.sender_address} />
			<Action type="swapped">swapped</Action>
			<span>up to</span>
			<Erc20 chain={chain} address={props.event.token_in_address} quantity={props.event.limit_quantity} />
			<span>for exactly</span>
			<Erc20 chain={chain} address={props.event.token_out_address} quantity={props.event.exact_quantity} />
			<span>with recipient</span>
			<Account chain={chain} address={props.event.recipient_address} />
			<span>via</span>
			<Account chain={chain} address={props.event.router_address} />
		</Description>
	);
}

export function IntentUniswapV3SwapV1AccountDescription(props: {
	event: IntentUniswapV3SwapV1;
	address: `0x${string}`;
}) {
	const chain = parseId(props.event.id).chainId;

	// 1. From the perspective of the purchaser

	if (isHexEqual(props.address, props.event.sender_address)) {
		if (props.event.swap_type === "exact_input") {
			if (isHexEqual(props.event.sender_address, props.event.recipient_address)) {
				return (
					<Description>
						{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
						<Action type="swapped">Swapped</Action>
						<Erc20 chain={chain} address={props.event.token_in_address} quantity={props.event.exact_quantity} />
						<span>for at least</span>
						<Erc20 chain={chain} address={props.event.token_out_address} quantity={props.event.limit_quantity} />
						<span>via</span>
						<Account chain={chain} address={props.event.router_address} />
					</Description>
				);
			}

			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Action type="swapped">Swapped</Action>
					<Erc20 chain={chain} address={props.event.token_in_address} quantity={props.event.exact_quantity} />
					<span>for at least</span>
					<Erc20 chain={chain} address={props.event.token_out_address} quantity={props.event.limit_quantity} />
					<span>with recipient</span>
					<Account chain={chain} address={props.event.recipient_address} />
					<span>via</span>
					<Account chain={chain} address={props.event.router_address} />
				</Description>
			);
		}

		if (isHexEqual(props.event.sender_address, props.event.recipient_address)) {
			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Action type="swapped">Swapped</Action>
					<span>up to</span>
					<Erc20 chain={chain} address={props.event.token_in_address} quantity={props.event.limit_quantity} />
					<span>for exactly</span>
					<Erc20 chain={chain} address={props.event.token_out_address} quantity={props.event.exact_quantity} />
					<span>via</span>
					<Account chain={chain} address={props.event.router_address} />
				</Description>
			);
		}

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="swapped">Swapped</Action>
				<span>up to</span>
				<Erc20 chain={chain} address={props.event.token_in_address} quantity={props.event.limit_quantity} />
				<span>for exactly</span>
				<Erc20 chain={chain} address={props.event.token_out_address} quantity={props.event.exact_quantity} />
				<span>with recipient</span>
				<Account chain={chain} address={props.event.recipient_address} />
				<span>via</span>
				<Account chain={chain} address={props.event.router_address} />
			</Description>
		);
	}

	return <IntentUniswapV3SwapV1Description event={props.event} />;
}
