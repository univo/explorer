import { maxUint256 } from "viem";

import { parseId } from "@/helpers";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { isHexEqual, unreachable } from "@/utils";
import { Description } from "@/components/description";
import { AAVE_V3_ETHEREUM_POOL_ADDRESS, type IntentAaveV3WithdrawV1 } from "./event";

export function IntentAaveV3WithdrawV1AccountDescription(props: { event: IntentAaveV3WithdrawV1; address: `0x${string}` }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);
	const quantity = BigInt(props.event.quantity);
	const all = quantity === maxUint256;

	// (tx.from) withdrawer_address: performing the withdrawal

	if (isHexEqual(props.address, props.event.withdrawer_address)) {
		if (isHexEqual(props.event.withdrawer_address, props.event.recipient_address)) {
			return (
				<Description success={props.event.success}>
					<Action type="withdrew">Withdraw</Action>
					{all ? <span>all</span> : null}
					<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} at={blockTimestamp} />
					<span>from</span>
					<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Action type="withdrew">Withdraw</Action>
				{all ? <span>all</span> : null}
				<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				<span>to</span>
				<Account chain={chain} address={props.event.recipient_address} />
			</Description>
		);
	}

	// recipient_address: didn't perform the withdrawal but received the assets

	if (isHexEqual(props.address, props.event.recipient_address)) {
		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.withdrawer_address} />
				<Action type="withdrew">withdraws</Action>
				{all ? <span>all</span> : null}
				<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				<span>to this account</span>
			</Description>
		);
	}

	// (tx.to) AAVE_V3_ETHEREUM_POOL_ADDRESS: the contract facilitating the withdrawal

	if (isHexEqual(props.address, AAVE_V3_ETHEREUM_POOL_ADDRESS)) {
		if (isHexEqual(props.event.withdrawer_address, props.event.recipient_address)) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.withdrawer_address} />
					<Action type="withdrew">withdraws</Action>
					{all ? <span>all</span> : null}
					<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} at={blockTimestamp} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.withdrawer_address} />
				<Action type="withdrew">withdraws</Action>
				{all ? <span>all</span> : null}
				<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} at={blockTimestamp} />
				<span>to</span>
				<Account chain={chain} address={props.event.recipient_address} />
			</Description>
		);
	}

	// token_address: the asset withdrawn

	if (isHexEqual(props.address, props.event.token_address)) {
		if (isHexEqual(props.event.withdrawer_address, props.event.recipient_address)) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.withdrawer_address} />
					<Action type="withdrew">withdraws</Action>
					{all ? <span>all</span> : null}
					<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} at={blockTimestamp} />
					<span>from</span>
					<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.withdrawer_address} />
				<Action type="withdrew">withdraws</Action>
				{all ? <span>all</span> : null}
				<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				<span>to</span>
				<Account chain={chain} address={props.event.recipient_address} />
			</Description>
		);
	}

	unreachable();
}
