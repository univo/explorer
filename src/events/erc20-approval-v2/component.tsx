import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { Token } from "@/components/token";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { Erc20ApprovalV2 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import type { Account as IAccount } from "@/state/account";

export function Erc20ApprovalV2Description(props: { event: Erc20ApprovalV2 }) {
	const all = props.event.quantity.length >= 36;
	const chain = parseId(props.event.id).chainId;
	const isZeroQuantity = props.event.quantity === "0";
	const isSpenderNullAddress = props.event.spender_address === "0x0000000000000000000000000000000000000000";
	const revoked = isZeroQuantity || isSpenderNullAddress;

	if (revoked) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.owner_address} />
				<Action type="revoked">revoked approval</Action>
				<span>for</span>
				<Account chain={chain} address={props.event.spender_address} />
				<span>to spend any</span>
				<Token chain={chain} address={props.event.token_address} />
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
			<Token chain={chain} address={props.event.token_address} quantity={all ? undefined : props.event.quantity} />
		</Description>
	);
}

export function Erc20ApprovalV2AccountDescription(props: { event: Erc20ApprovalV2; account: IAccount }) {
	const all = props.event.quantity.length >= 36;
	const chain = parseId(props.event.id).chainId;
	const isZeroQuantity = props.event.quantity === "0";
	const isSpenderNullAddress = props.event.spender_address === "0x0000000000000000000000000000000000000000";
	const revoked = isZeroQuantity || isSpenderNullAddress;
	const type = revoked ? "revoked" : "approved";
	const quantity = !revoked && !all ? props.event.quantity : undefined;

	if (isAddressEqual(props.account.address, props.event.owner_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type={revoked ? "revoked" : "approved"}>{revoked ? "Revoked approval" : "Approved"}</Action>
				{revoked === true && <span>for</span>}
				<Account chain={chain} address={props.event.spender_address} />
				<span>{revoked ? "to spend any" : "to spend"}</span>
				{revoked === false && all === true && <span>all</span>}
				<Token chain={chain} address={props.event.token_address} quantity={quantity} />
			</Description>
		);
	}

	if (isAddressEqual(props.account.address, props.event.spender_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type={type}>{revoked ? "Approval revoked" : "Received approval"}</Action>
				<span>{revoked ? "by" : "from"}</span>
				<Account chain={chain} address={props.event.owner_address} />
				<span>{revoked ? "to spend any" : "to spend"}</span>
				{revoked === false && all === true && <span>all</span>}
				<Token chain={chain} address={props.event.token_address} quantity={quantity} />
			</Description>
		);
	}

	return <Erc20ApprovalV2Description event={props.event} />;
}
