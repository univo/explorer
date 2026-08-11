import { parseId } from "@/helpers";
import { isHexEqual } from "@/utils";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import { AAVE_V3_ETHEREUM_POOL_ADDRESS, type IntentAaveV3BorrowV1 } from "./event";

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
					<Action type="borrowed">Borrowed</Action>
					<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
					<span>from</span>
					<Account chain={chain} address={AAVE_V3_ETHEREUM_POOL_ADDRESS} />
				</Description>
			);
		}

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="borrowed">Borrowed</Action>
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
					<Action type="borrowed">Delegated</Action>
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
