import { parseId } from "@/helpers";
import { isHexEqual } from "@/utils";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import { AAVE_V3_ETHEREUM_POOL_ADDRESS, type IntentAaveV3BorrowV1 } from "./event";

// Do we change up the columns for the block view to include `actor`?
// The end goal would be nice if intents = account views and logs = objective views
// To get there, we need to solve the issue with fallbacks and the block view
// We can solve the first by ensuring we define an account view for all accounts registered in the index (ensures tx.from is covered)
// Then we can add an actor field to the block view

// FINALISED THINKING

// 1. We never show log events from the account perspective TRUE
// 2. Intents should not have an objective view, rn they are needed as fallback and for the block view PENDING
// 3. We don't need to provide a fallback to the account description if it covers all accounts specified in the index PENDING
// 4. We must always specify an account view for tx.from (or whatever field it's stored as) so we have something to show in the tx action

export function IntentAaveV3BorrowV1Description(props: { event: IntentAaveV3BorrowV1 }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	if (isHexEqual(props.event.borrower_address, props.event.on_behalf_of_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.borrower_address} />
				<Action type="borrowed">borrowed</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
			</Description>
		);
	}

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.borrower_address} />
			<Action type="borrowed">borrowed</Action>
			<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
			<span>from</span>
			<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
			<span>against the debt position owned by</span>
			<Account chain={chain} address={props.event.on_behalf_of_address} />
		</Description>
	);
}

export function IntentAaveV3BorrowV1AccountDescription(props: { event: IntentAaveV3BorrowV1; address: `0x${string}` }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	// 1. From the perspective of the borrower

	if (isHexEqual(props.address, props.event.borrower_address)) {
		if (isHexEqual(props.event.borrower_address, props.event.on_behalf_of_address)) {
			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Action type="borrowed">Borrow</Action>
					<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
					<span>from</span>
					<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				</Description>
			);
		}

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="borrowed">Borrow</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				<span>against the debt position owned by</span>
				<Account chain={chain} address={props.event.on_behalf_of_address} />
			</Description>
		);
	}

	// 2. From the perspective of the on_behalf_of_address when they aren't borrowing

	if (isHexEqual(props.address, props.event.on_behalf_of_address)) {
		if (!isHexEqual(props.event.on_behalf_of_address, props.event.borrower_address)) {
			return (
				<Description>
					<Action type="borrowed">Delegate</Action>
					<span>credit of</span>
					<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
					<span>from</span>
					<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
					<span>to</span>
					<Account chain={chain} address={props.event.borrower_address} />
				</Description>
			);
		}
	}

	return <IntentAaveV3BorrowV1Description event={props.event} />;
}
