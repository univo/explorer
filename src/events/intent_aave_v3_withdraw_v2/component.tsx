import { maxUint256 } from "viem";

import { isHexEqual } from "@/utils";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { getExternalChain } from "@/helpers";
import { Account } from "@/components/account";
import { Description } from "@/components/description";
import { AAVE_V3_ETHEREUM_POOL_ADDRESS, type IntentAaveV3WithdrawV2 } from "./event";

export function IntentAaveV3WithdrawV2AccountDescription(props: { event: IntentAaveV3WithdrawV2; address: `0x${string}` | undefined }) {
	const chain = getExternalChain(props.event.chain);
	const blockTimestamp = props.event.block_timestamp.getTime() / 1000;
	const quantity = BigInt(props.event.quantity);
	const all = quantity === maxUint256;

	// (tx.from) withdrawer_address: performing the withdrawal

	if (isHexEqual(props.address, props.event.withdrawer_address)) {
		if (isHexEqual(props.event.withdrawer_address, props.event.recipient_address)) {
			return (
				<Description success={props.event.success}>
					<Action type="withdraw">Withdraw</Action>
					{all ? <span>all</span> : null}
					<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} at={blockTimestamp} />
					<span>from</span>
					<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Action type="withdraw">Withdraw</Action>
				{all ? <span>all</span> : null}
				<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				<span>to</span>
				<Account chain={chain} address={props.event.recipient_address} />
			</Description>
		);
	}

	// recipient_address: didn't perform the withdrawal but received the assets. To get here means we failed the previous
	// check and are not the account withdrawing but are the recipient of the withdrawn funds

	if (isHexEqual(props.address, props.event.recipient_address)) {
		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.withdrawer_address} />
				<Action type="withdraw">withdraws</Action>
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
					<Action type="withdraw">withdraws</Action>
					{all ? <span>all</span> : null}
					<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} at={blockTimestamp} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.withdrawer_address} />
				<Action type="withdraw">withdraws</Action>
				{all ? <span>all</span> : null}
				<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} at={blockTimestamp} />
				<span>to</span>
				<Account chain={chain} address={props.event.recipient_address} />
			</Description>
		);
	}

	// token_address: the asset withdrawn

	if (isHexEqual(props.event.withdrawer_address, props.event.recipient_address)) {
		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.withdrawer_address} />
				<Action type="withdraw">withdraws</Action>
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
			<Action type="withdraw">withdraws</Action>
			{all ? <span>all</span> : null}
			<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : quantity} at={blockTimestamp} />
			<span>from</span>
			<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
			<span>to</span>
			<Account chain={chain} address={props.event.recipient_address} />
		</Description>
	);
}
