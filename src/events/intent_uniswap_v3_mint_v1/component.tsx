import { parseId } from "@/helpers";
import { isHexEqual } from "@/utils";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { ExclamationIcon } from "@/components/icons";
import type { IntentUniswapV3MintV1 } from "./event";
import { Description } from "@/components/description";

export function IntentUniswapV3MintV1Description(props: { event: IntentUniswapV3MintV1 }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.sender_address} />
			<Action type="supplied">supplied</Action>
			<span>liquidity</span>
			<Erc20 chain={chain} address={props.event.token_0_address} quantity={props.event.token_0_desired_quantity} at={blockTimestamp} />
			<span>and</span>
			<Erc20 chain={chain} address={props.event.token_1_address} quantity={props.event.token_1_desired_quantity} at={blockTimestamp} />
			<span>to</span>
			<Account chain={chain} address={props.event.pool_address} />
		</Description>
	);
}

export function IntentUniswapV3MintV1AccountDescription(props: {
	event: IntentUniswapV3MintV1;
	address: `0x${string}`;
}) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	// 1. From the perspective of the suppler (always the sender address)

	if (isHexEqual(props.address, props.event.sender_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="minted">Supply</Action>
				<span>liquidity</span>
				<Erc20 chain={chain} address={props.event.token_0_address} quantity={props.event.token_0_desired_quantity} at={blockTimestamp} />
				<span>and</span>
				<Erc20 chain={chain} address={props.event.token_1_address} quantity={props.event.token_1_desired_quantity} at={blockTimestamp} />
				<span>to</span>
				<Account chain={chain} address={props.event.pool_address} />
			</Description>
		);
	}

	return <IntentUniswapV3MintV1Description event={props.event} />;
}
