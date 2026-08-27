import { Fragment } from "react";

import { parseId } from "@/helpers";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { isHexEqual, unreachable } from "@/utils";
import { UNISWAP_V3_POSITION_MANAGER_ADDRESS, type IntentUniswapV3MintV1 } from "./event";
import { Description } from "@/components/description";

export function IntentUniswapV3MintV1AccountDescription(props: { event: IntentUniswapV3MintV1; address: `0x${string}` }) {
	const { chainId: chain } = parseId(props.event.id);

	// (tx.from) sender_address: supplier of liquidity. Note it's possible to supply only one
	// side of that liquidity

	if (isHexEqual(props.address, props.event.sender_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="minted">Supply</Action>
				<span>a minimum liquidity of</span>
				<MinimumLiquidity event={props.event} />
				<span>to</span>
				<Account chain={chain} address={props.event.pool_address} />
			</Description>
		);
	}

	// recipient_address: getting here means we are not the supplier of the liquidity but just
	// received the receipt for the position

	if (isHexEqual(props.address, props.event.recipient_address)) {
		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.sender_address} />
				<Action type="received">supplies</Action>
				<span>a minimum liquidity of</span>
				<MinimumLiquidity event={props.event} />
				<span>to</span>
				<Account chain={chain} address={props.event.pool_address} />
				<span>and this account received the position receipt</span>
			</Description>
		);
	}

	// (tx.to) UNISWAP_V3_POSITION_MANAGER_ADDRESS

	if (isHexEqual(props.address, UNISWAP_V3_POSITION_MANAGER_ADDRESS)) {
		if (isHexEqual(props.event.sender_address, props.event.recipient_address)) {
			<Description success={props.event.success}>
				<Action type="minted">Supply</Action>
				<span>a minimum liquidity of</span>
				<MinimumLiquidity event={props.event} />
				<span>to</span>
				<Account chain={chain} address={props.event.pool_address} />
			</Description>;
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.sender_address} />
				<Action type="received">supplies</Action>
				<span>a minimum liquidity of</span>
				<MinimumLiquidity event={props.event} />
				<span>to</span>
				<Account chain={chain} address={props.event.pool_address} />
				<span>with recipient</span>
				<Account chain={chain} address={props.event.recipient_address} />
			</Description>
		);
	}

	// token_0_address

	if (isHexEqual(props.address, props.event.token_0_address)) {
		if (isHexEqual(props.event.sender_address, props.event.recipient_address)) {
			<Description success={props.event.success}>
				<Action type="minted">Supply</Action>
				<span>a minimum liquidity of</span>
				<MinimumLiquidity event={props.event} />
				<span>to</span>
				<Account chain={chain} address={props.event.pool_address} />
			</Description>;
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.sender_address} />
				<Action type="received">supplies</Action>
				<span>a minimum liquidity of</span>
				<MinimumLiquidity event={props.event} />
				<span>to</span>
				<Account chain={chain} address={props.event.pool_address} />
				<span>with recipient</span>
				<Account chain={chain} address={props.event.recipient_address} />
			</Description>
		);
	}

	// token_1_address

	if (isHexEqual(props.address, props.event.token_1_address)) {
		if (isHexEqual(props.event.sender_address, props.event.recipient_address)) {
			<Description success={props.event.success}>
				<Action type="minted">Supply</Action>
				<span>a minimum liquidity of</span>
				<MinimumLiquidity event={props.event} />
				<span>to</span>
				<Account chain={chain} address={props.event.pool_address} />
			</Description>;
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.sender_address} />
				<Action type="received">supplies</Action>
				<span>a minimum liquidity of</span>
				<MinimumLiquidity event={props.event} />
				<span>to</span>
				<Account chain={chain} address={props.event.pool_address} />
				<span>with recipient</span>
				<Account chain={chain} address={props.event.recipient_address} />
			</Description>
		);
	}

	unreachable();
}

function MinimumLiquidity(props: { event: IntentUniswapV3MintV1 }) {
	// Normally I hate making utility functions like this but in this case it's worth it. In Uniswap
	// it's possible to supply only one side of the liquidity pool

	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	const token0DesiredQuantity = BigInt(props.event.token_0_desired_quantity);
	const token0MinimumQuantity = BigInt(props.event.token_0_minimum_quantity);

	const token1DesiredQuantity = BigInt(props.event.token_1_desired_quantity);
	const token1MinimumQuantity = BigInt(props.event.token_1_minimum_quantity);

	if (token0DesiredQuantity === 0n && token0MinimumQuantity === 0n) {
		return <Erc20 chain={chain} address={props.event.token_1_address} quantity={token1MinimumQuantity} at={blockTimestamp} />;
	}

	if (token1DesiredQuantity === 0n && token1MinimumQuantity === 0n) {
		return <Erc20 chain={chain} address={props.event.token_0_address} quantity={token0MinimumQuantity} at={blockTimestamp} />;
	}

	return (
		<Fragment>
			<Erc20 chain={chain} address={props.event.token_0_address} quantity={token0MinimumQuantity} at={blockTimestamp} />
			<span>and</span>
			<Erc20 chain={chain} address={props.event.token_1_address} quantity={token1MinimumQuantity} at={blockTimestamp} />
		</Fragment>
	);
}
