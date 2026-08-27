import { parseId } from "@/helpers";
import { isHexEqual } from "@/utils";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { LogUniswapV3SwapV1 } from "./event";
import { Description } from "@/components/description";
import { getPoolByAddress, type LogUniswapV3PoolCreatedV1 } from "@/events/log_uniswap_v3_pool_created_v1/event";

export async function LogUniswapV3SwapV1Description(props: { event: LogUniswapV3SwapV1 }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	const pool = await getPoolByAddress(props.event.pool_address);

	if (pool === null) {
		throw new Error("Expected pool to already exist if a swap event has taken place");
	}

	const swap = getSwap(pool, props.event);

	if (isHexEqual(props.event.sender_address, props.event.recipient_address)) {
		return (
			<Description>
				<Account chain={chain} address={props.event.sender_address} />
				<Action type="swap">swapped</Action>
				<Erc20 chain={chain} address={swap.tokenIn} quantity={swap.amountIn} at={blockTimestamp} />
				<span>for</span>
				<Erc20 chain={chain} address={swap.tokenOut} quantity={swap.amountOut} at={blockTimestamp} />
				<span>via</span>
				<Account chain={chain} address={props.event.pool_address} />
			</Description>
		);
	}

	return (
		<Description>
			<Account chain={chain} address={props.event.sender_address} />
			<Action type="swap">swapped</Action>
			<Erc20 chain={chain} address={swap.tokenIn} quantity={swap.amountIn} at={blockTimestamp} />
			<span>for</span>
			<Erc20 chain={chain} address={swap.tokenOut} quantity={swap.amountOut} at={blockTimestamp} />
			<span>with recipient</span>
			<Account chain={chain} address={props.event.recipient_address} />
			<span>via</span>
			<Account chain={chain} address={props.event.pool_address} />
		</Description>
	);
}

function getSwap(pool: LogUniswapV3PoolCreatedV1, swap: LogUniswapV3SwapV1) {
	if (swap.amount_0 > 0n && swap.amount_1 < 0n) {
		return {
			amountIn: swap.amount_0,
			amountOut: -swap.amount_1,
			tokenIn: pool.token_0_address,
			tokenOut: pool.token_1_address,
		};
	}

	if (swap.amount_1 > 0n && swap.amount_0 < 0n) {
		return {
			amountIn: swap.amount_1,
			amountOut: -swap.amount_0,
			tokenIn: pool.token_1_address,
			tokenOut: pool.token_0_address,
		};
	}

	throw new Error("Expected swap amounts to be known");
}
