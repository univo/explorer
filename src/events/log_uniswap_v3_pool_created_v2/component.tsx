import { Action } from "@/components/action";
import { getExternalChain } from "@/helpers";
import { Account } from "@/components/account";
import { UNISWAP_V3_FACTORY_ADDRESS } from "./event";
import { Description } from "@/components/description";
import type { LogUniswapV3PoolCreatedV2 } from "./event";

export function LogUniswapV3PoolCreatedV2Description(props: { event: LogUniswapV3PoolCreatedV2; address: `0x${string}` | undefined }) {
	const chain = getExternalChain(props.event.chain);

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
