import { maxUint256 } from "viem";

import { parseId } from "@/helpers";
import { isHexEqual } from "@/utils";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { Description } from "@/components/description";
import { AAVE_V3_ETHEREUM_POOL_ADDRESS, type IntentAaveV3RepayV1 } from "./event";

export function IntentAaveV3RepayV1AccountDescription(props: { event: IntentAaveV3RepayV1; address: `0x${string}` }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);
	const quantity = BigInt(props.event.quantity);
	const all = quantity === maxUint256;

	// (tx.from) repayer_address: repaying the debt

	if (isHexEqual(props.address, props.event.repayer_address)) {
		if (isHexEqual(props.event.repayer_address, props.event.on_behalf_of_address)) {
			if (all) {
				return (
					<Description success={props.event.success}>
						<Action type="repay">Repay</Action>
						<span>the entire</span>
						<Erc20 chain={chain} address={props.event.token_address} at={blockTimestamp} />
						<span>debt with</span>
						<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
					</Description>
				);
			}

			return (
				<Description success={props.event.success}>
					<span>Partially</span>
					<Action type="repay">repay</Action>
					<Erc20 chain={chain} address={props.event.token_address} quantity={quantity} at={blockTimestamp} />
					<span>of debt with</span>
					<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				</Description>
			);
		}

		if (all) {
			return (
				<Description success={props.event.success}>
					<Action type="repay">Repay</Action>
					<span>the entire</span>
					<Erc20 chain={chain} address={props.event.token_address} at={blockTimestamp} />
					<span>debt to</span>
					<Account chain={chain} address={props.event.on_behalf_of_address} />
					<span>with</span>
					<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<span>Partially</span>
				<Action type="repay">repay</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={quantity} at={blockTimestamp} />
				<span>of debt to</span>
				<Account chain={chain} address={props.event.on_behalf_of_address} />
				<span>with</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
			</Description>
		);
	}

	// on_behalf_of_address: when repaying the debt owned by a different account. To get here means we failed the
	// previous check and this is not the repaying address but simply the beneficiary of the repayment

	if (isHexEqual(props.address, props.event.on_behalf_of_address)) {
		if (all) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.repayer_address} />
					<Action type="repay">repays</Action>
					<span>our entire</span>
					<Erc20 chain={chain} address={props.event.token_address} at={blockTimestamp} />
					<span>debt with</span>
					<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.repayer_address} />
				<span>partially</span>
				<Action type="repay">repay</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
				<span>of our debt with</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
			</Description>
		);
	}

	// (tx.to) AAVE_V3_ETHEREUM_POOL_ADDRESS: the contract facilitating the repayment

	if (isHexEqual(props.address, AAVE_V3_ETHEREUM_POOL_ADDRESS)) {
		if (isHexEqual(props.event.repayer_address, props.event.on_behalf_of_address)) {
			if (all) {
				return (
					<Description success={props.event.success}>
						<Account chain={chain} address={props.event.repayer_address} />
						<Action type="repay">repays</Action>
						<span>their entire</span>
						<Erc20 chain={chain} address={props.event.token_address} at={blockTimestamp} />
						<span>debt</span>
					</Description>
				);
			}

			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.repayer_address} />
					<span>partially</span>
					<Action type="repay">repays</Action>
					<Erc20 chain={chain} address={props.event.token_address} quantity={quantity} at={blockTimestamp} />
					<span>of their debt</span>
				</Description>
			);
		}

		if (all) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.repayer_address} />
					<Action type="repay">repays</Action>
					<span>the entire</span>
					<Erc20 chain={chain} address={props.event.token_address} at={blockTimestamp} />
					<span>debt to</span>
					<Account chain={chain} address={props.event.on_behalf_of_address} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.repayer_address} />
				<span>partially</span>
				<Action type="repay">repays</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={quantity} at={blockTimestamp} />
				<span>of debt to</span>
				<Account chain={chain} address={props.event.on_behalf_of_address} />
			</Description>
		);
	}

	// token_address: the asset repaid

	if (isHexEqual(props.event.repayer_address, props.event.on_behalf_of_address)) {
		if (all) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.repayer_address} />
					<Action type="repay">repays</Action>
					<span>their entire</span>
					<Erc20 chain={chain} address={props.event.token_address} at={blockTimestamp} />
					<span>debt with</span>
					<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.repayer_address} />
				<span>partially</span>
				<Action type="repay">repays</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={quantity} at={blockTimestamp} />
				<span>of their debt with</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
			</Description>
		);
	}

	if (all) {
		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.repayer_address} />
				<Action type="repay">repays</Action>
				<span>the entire</span>
				<Erc20 chain={chain} address={props.event.token_address} at={blockTimestamp} />
				<span>debt to</span>
				<Account chain={chain} address={props.event.on_behalf_of_address} />
				<span>with</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
			</Description>
		);
	}

	return (
		<Description success={props.event.success}>
			<Account chain={chain} address={props.event.repayer_address} />
			<span>partially</span>
			<Action type="repay">repays</Action>
			<Erc20 chain={chain} address={props.event.token_address} quantity={quantity} at={blockTimestamp} />
			<span>of debt to</span>
			<Account chain={chain} address={props.event.on_behalf_of_address} />
			<span>with</span>
			<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
		</Description>
	);
}
