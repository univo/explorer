import { parseId } from "@/helpers";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { isHexEqual, unreachable } from "@/utils";
import { Description } from "@/components/description";
import { AAVE_V3_ETHEREUM_POOL_ADDRESS, type IntentAaveV3BorrowV1 } from "./event";

export function IntentAaveV3BorrowV1AccountDescription(props: { event: IntentAaveV3BorrowV1; address: `0x${string}` }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	// (tx.from) borrower_address: doing the borrowing

	if (isHexEqual(props.address, props.event.borrower_address)) {
		// Simple case is when a user is borrowing using their own collateral already supplied

		if (isHexEqual(props.event.borrower_address, props.event.on_behalf_of_address)) {
			return (
				<Description success={props.event.success}>
					<Action type="borrow">Borrow</Action>
					<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
					<span>from</span>
					<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				</Description>
			);
		}

		// However, it's also possible to borrow against somebody else's position. The agreement can
		// be enforced on or offchain and allows the borrower to access uncollateralized liquidity

		return (
			<Description success={props.event.success}>
				<Action type="borrow">Borrow</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				<span>against the debt position owned by</span>
				<Account chain={chain} address={props.event.on_behalf_of_address} />
			</Description>
		);
	}

	// on_behalf_of_address: the supplier (aka delegator) of the credit. If we get here it means we failed
	// the earlier check if the borrower and delegater are equal. Therefore, this event shows on the
	// delegators account when somebody borrows against their position

	if (isHexEqual(props.address, props.event.on_behalf_of_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="borrow">Delegate</Action>
				<span>credit of</span>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				<span>to</span>
				<Account chain={chain} address={props.event.borrower_address} />
			</Description>
		);
	}

	// (tx.to) AAVE_V3_ETHEREUM_POOL_ADDRESS: the contract facilitating the borrowing/lending

	if (isHexEqual(props.address, AAVE_V3_ETHEREUM_POOL_ADDRESS)) {
		if (isHexEqual(props.event.borrower_address, props.event.on_behalf_of_address)) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.borrower_address} />
					<Action type="borrow">borrows</Action>
					<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
					<span>against their own collateral</span>
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.borrower_address} />
				<Action type="borrow">borrows</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
				<span>against the debt position owned by</span>
				<Account chain={chain} address={props.event.on_behalf_of_address} />
			</Description>
		);
	}

	// token_address: the asset borrowed/lent

	if (isHexEqual(props.address, props.event.token_address)) {
		if (isHexEqual(props.event.borrower_address, props.event.on_behalf_of_address)) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.borrower_address} />
					<Action type="borrow">borrows</Action>
					<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
					<span>from</span>
					<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.borrower_address} />
				<Action type="borrow">borrows</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				<span>against the debt position owned by</span>
				<Account chain={chain} address={props.event.on_behalf_of_address} />
			</Description>
		);
	}

	unreachable();
}
