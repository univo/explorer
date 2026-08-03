import { maxUint256 } from "viem";

import { parseId } from "@/helpers";
import { isHexEqual } from "@/utils";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import { AAVE_V3_ETHEREUM_POOL_ADDRESS, type IntentAaveV3RepayV1 } from "./event";

export function IntentAaveV3RepayV1Description(props: { event: IntentAaveV3RepayV1 }) {
	const chain = parseId(props.event.id).chainId;
	const quantity = BigInt(props.event.quantity);
	const all = quantity === maxUint256;

	if (isHexEqual(props.event.repayer_address, props.event.on_behalf_of_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.repayer_address} />
				<Action type="repaid">repaid</Action>
				{all ? <span>all</span> : null}
				<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} />
				<span>to</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				{props.event.use_atokens ? <span>using aTokens</span> : null}
			</Description>
		);
	}

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.repayer_address} />
			<Action type="repaid">repaid</Action>
			{all ? <span>all</span> : null}
			<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} />
			<span>to</span>
			<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
			<span>on behalf of</span>
			<Account chain={chain} address={props.event.on_behalf_of_address} />
		</Description>
	);
}

export function IntentAaveV3RepayV1AccountDescription(props: { event: IntentAaveV3RepayV1; address: `0x${string}` }) {
	const chain = parseId(props.event.id).chainId;
	const quantity = BigInt(props.event.quantity);
	const all = quantity === maxUint256;

	// 1. From the perspective of the repayer

	if (isHexEqual(props.address, props.event.repayer_address)) {
		if (isHexEqual(props.event.repayer_address, props.event.on_behalf_of_address)) {
			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Action type="repaid">Repaid</Action>
					{all ? <span>all</span> : null}
					<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} />
					<span>to</span>
					<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
					{props.event.use_atokens ? <span>using aTokens</span> : null}
				</Description>
			);
		}

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="repaid">Repaid</Action>
				{all ? <span>all</span> : null}
				<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} />
				<span>to</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				<span>on behalf of</span>
				<Account chain={chain} address={props.event.on_behalf_of_address} />
			</Description>
		);
	}

	return <IntentAaveV3RepayV1Description event={props.event} />;
}
