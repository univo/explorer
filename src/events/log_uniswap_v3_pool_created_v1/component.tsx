import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { UNISWAP_V3_FACTORY_ADDRESS } from "./event";
import { Description } from "@/components/description";
import type { LogUniswapV3PoolCreatedV1 } from "./event";

export function LogUniswapV3PoolCreatedV1Description(props: { event: LogUniswapV3PoolCreatedV1 }) {
	const chain = parseId(props.event.id).chainId;

	return (
		<Description>
			<Account chain={chain} address={UNISWAP_V3_FACTORY_ADDRESS} />
			<Action type="deploy">deployed</Action>
			<span>a new liquidity pool</span>
			<Account chain={chain} address={props.event.pool_address} />
			<span>for tokens</span>
			<Account chain={chain} address={props.event.token_0_address} />
			<span>and</span>
			<Account chain={chain} address={props.event.token_1_address} />
		</Description>
	);
}
