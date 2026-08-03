import { maxUint256 } from "viem";

import { parseId } from "@/helpers";
import { isHexEqual } from "@/utils";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import { AAVE_V3_ETHEREUM_POOL_ADDRESS, type IntentAaveV3WithdrawV1 } from "./event";

export function IntentAaveV3WithdrawV1Description(props: { event: IntentAaveV3WithdrawV1 }) {
	const chain = parseId(props.event.id).chainId;
	const quantity = BigInt(props.event.quantity);
	const all = quantity === maxUint256;

	if (isHexEqual(props.event.withdrawer_address, props.event.recipient_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.withdrawer_address} />
				<Action type="withdrew">withdrew</Action>
				{all ? <span>all</span> : null}
				<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} />
				<span>from</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
			</Description>
		);
	}

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.withdrawer_address} />
			<Action type="withdrew">withdrew</Action>
			{all ? <span>all</span> : null}
			<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} />
			<span>from</span>
			<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
			<span>to</span>
			<Account chain={chain} address={props.event.recipient_address} />
		</Description>
	);
}

export function IntentAaveV3WithdrawV1AccountDescription(props: {
	event: IntentAaveV3WithdrawV1;
	address: `0x${string}`;
}) {
	const chain = parseId(props.event.id).chainId;
	const quantity = BigInt(props.event.quantity);
	const all = quantity === maxUint256;

	// 1. From the perspective of the withdrawer

	if (isHexEqual(props.address, props.event.withdrawer_address)) {
		if (isHexEqual(props.event.withdrawer_address, props.event.recipient_address)) {
			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Action type="withdrew">Withdrew</Action>
					{all ? <span>all</span> : null}
					<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} />
					<span>from</span>
					<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				</Description>
			);
		}

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="withdrew">Withdrew</Action>
				{all ? <span>all</span> : null}
				<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} />
				<span>from</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				<span>to</span>
				<Account chain={chain} address={props.event.recipient_address} />
			</Description>
		);
	}

	return <IntentAaveV3WithdrawV1Description event={props.event} />;
}
