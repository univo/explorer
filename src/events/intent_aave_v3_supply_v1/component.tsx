import { parseId } from "@/helpers";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { isHexEqual, unreachable } from "@/utils";
import { Description } from "@/components/description";
import { AAVE_V3_ETHEREUM_POOL_ADDRESS, type IntentAaveV3SupplyV1 } from "./event";

export function IntentAaveV3SupplyV1AccountDescription(props: { event: IntentAaveV3SupplyV1; address: `0x${string}` }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	// (tx.from) supplier_address: the account initiating the action and always supplying the collateral

	if (isHexEqual(props.address, props.event.supplier_address)) {
		if (isHexEqual(props.event.supplier_address, props.event.on_behalf_of_address)) {
			return (
				<Description success={props.event.success}>
					<Action type="supplied">Supply</Action>
					<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
					<span>collateral with</span>
					<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Action type="supplied">Supply</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
				<span>collateral to</span>
				<Account chain={chain} address={props.event.on_behalf_of_address} />
				<span>with</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
			</Description>
		);
	}

	// on_behalf_of_address: the account receiving the collateral but not supplying it

	if (isHexEqual(props.address, props.event.on_behalf_of_address)) {
		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.supplier_address} />
				<Action type="supplied">supplies</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
				<span>collateral to our position with</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
			</Description>
		);
	}

	// (tx.to) AAVE_V3_ETHEREUM_POOL_ADDRESS: the contract facilitating the supplying

	if (isHexEqual(props.address, AAVE_V3_ETHEREUM_POOL_ADDRESS)) {
		if (isHexEqual(props.event.supplier_address, props.event.on_behalf_of_address)) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.supplier_address} />
					<Action type="supplied">supplies</Action>
					<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
					<span>collateral</span>
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.supplier_address} />
				<Action type="supplied">supplies</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
				<span>collateral to</span>
				<Account chain={chain} address={props.event.on_behalf_of_address} />
			</Description>
		);
	}

	// token_address: the collateral supplied

	if (isHexEqual(props.address, props.event.token_address)) {
		if (isHexEqual(props.event.supplier_address, props.event.on_behalf_of_address)) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.supplier_address} />
					<Action type="supplied">supplies</Action>
					<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
					<span>collateral with</span>
					<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.supplier_address} />
				<Action type="supplied">supplies</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
				<span>collateral to</span>
				<Account chain={chain} address={props.event.on_behalf_of_address} />
				<span>with</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
			</Description>
		);
	}

	unreachable();
}
