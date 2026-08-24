import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { IntentErc20ApprovalV1 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";

export function IntentErc20ApprovalV1Description(props: { event: IntentErc20ApprovalV1 }) {
	const all = props.event.quantity.length >= 30;
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	const isZeroQuantity = BigInt(props.event.quantity) === 0n;
	const isSpenderNullAddress = props.event.spender_address === "0x0000000000000000000000000000000000000000";
	const revoked = isZeroQuantity || isSpenderNullAddress;

	if (revoked) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.owner_address} />
				<Action type="revoked">revoked</Action>
				<span>approval for</span>
				<Account chain={chain} address={props.event.spender_address} />
				<span>to spend any</span>
				<Erc20 chain={chain} address={props.event.token_address} at={blockTimestamp} />
			</Description>
		);
	}

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.owner_address} />
			<Action type="approved">approved</Action>
			<Account chain={chain} address={props.event.spender_address} />
			<span>to spend</span>
			{all === true && <span>all</span>}
			<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : props.event.quantity} at={blockTimestamp} />
		</Description>
	);
}

export function IntentErc20ApprovalV1AccountDescription(props: {
	event: IntentErc20ApprovalV1;
	address: `0x${string}`;
}) {
	const all = props.event.quantity.length >= 30;
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	const isZeroQuantity = BigInt(props.event.quantity) === 0n;
	const isSpenderNullAddress = props.event.spender_address === "0x0000000000000000000000000000000000000000";
	const revoked = isZeroQuantity || isSpenderNullAddress;
	const quantity = !revoked && !all ? props.event.quantity : undefined;

	// 1. From the perspective of the owner

	if (isAddressEqual(props.address, props.event.owner_address)) {
		if (revoked) {
			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Action type="revoked">Revoke</Action>
					<span>approval for</span>
					<Account chain={chain} address={props.event.spender_address} />
					<span>to spend any</span>
					<Erc20 chain={chain} address={props.event.token_address} quantity={quantity} at={blockTimestamp} />
				</Description>
			);
		}

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="approved">Approve</Action>
				<Account chain={chain} address={props.event.spender_address} />
				<span>to spend</span>
				{all === true && <span>all</span>}
				<Erc20 chain={chain} address={props.event.token_address} quantity={quantity} at={blockTimestamp} />
			</Description>
		);
	}

	// 2. From the perspective of the account receiving approval/revocation

	if (isAddressEqual(props.address, props.event.spender_address)) {
		if (revoked) {
			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Action type="revoked">Revoke</Action>
					<span>approval by</span>
					<Account chain={chain} address={props.event.owner_address} />
					<span>to spend any</span>
					<Erc20 chain={chain} address={props.event.token_address} quantity={quantity} at={blockTimestamp} />
				</Description>
			);
		}

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="approved">Receive approvel</Action>
				<span>from</span>
				<Account chain={chain} address={props.event.owner_address} />
				<span>to spend</span>
				{all === true && <span>all</span>}
				<Erc20 chain={chain} address={props.event.token_address} quantity={quantity} at={blockTimestamp} />
			</Description>
		);
	}

	return <IntentErc20ApprovalV1Description event={props.event} />;
}
