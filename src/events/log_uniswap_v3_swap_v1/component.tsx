import { parseId } from "@/helpers";
import { isHexEqual } from "@/utils";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { Description } from "@/components/description";
import type { LogUniswapV3SwapV1 } from "./event";
import { getPoolByAddress, type LogUniswapV3PoolCreatedV1 } from "@/events/log_uniswap_v3_pool_created_v1/event";

export async function LogUniswapV3SwapV1Description(props: { event: LogUniswapV3SwapV1 }) {
	const chain = parseId(props.event.id).chainId;

	const pool = await getPoolByAddress(props.event.pool_address);

	if (pool === null) {
		throw new Error("Expected pool to already exist if a swap event has taken place");
	}

	const swap = getSwap(pool, props.event);

	if (swap === null) {
		throw new Error("Expected swap amounts to be known");
	}

	if (isHexEqual(props.event.sender_address, props.event.recipient_address)) {
		return (
			<Description>
				<Account chain={chain} address={props.event.sender_address} />
				<Action type="swapped">swapped</Action>
				<Erc20 chain={chain} address={swap.tokenIn} quantity={swap.amountIn} />
				<span>for</span>
				<Erc20 chain={chain} address={swap.tokenOut} quantity={swap.amountOut} />
				<span>via</span>
				<Account chain={chain} address={props.event.pool_address} />
			</Description>
		);
	}

	return (
		<Description>
			<Account chain={chain} address={props.event.sender_address} />
			<Action type="swapped">swapped</Action>
			<Erc20 chain={chain} address={swap.tokenIn} quantity={swap.amountIn} />
			<span>for</span>
			<Erc20 chain={chain} address={swap.tokenOut} quantity={swap.amountOut} />
			<span>with recipient</span>
			<Account chain={chain} address={props.event.recipient_address} />
			<span>via</span>
			<Account chain={chain} address={props.event.pool_address} />
		</Description>
	);
}

function getSwap(pool: LogUniswapV3PoolCreatedV1, swap: LogUniswapV3SwapV1) {
	const amount0 = swap.amount_0;
	const amount1 = swap.amount_1;

	if (amount0 > 0n && amount1 < 0n) {
		return {
			amountIn: amount0,
			amountOut: -amount1,
			tokenIn: pool.token_0_address,
			tokenOut: pool.token_1_address,
		};
	}

	if (amount1 > 0n && amount0 < 0n) {
		return {
			amountIn: amount1,
			amountOut: -amount0,
			tokenIn: pool.token_1_address,
			tokenOut: pool.token_0_address,
		};
	}

	return null;
}
