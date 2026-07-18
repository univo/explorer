import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { Erc721ApprovalV3 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import type { Account as IAccount } from "@/state/account";

export function Erc721ApprovalV3Description(props: { event: Erc721ApprovalV3 }) {
	const chain = parseId(props.event.id).chainId;
	const revoked = props.event.spender_address === "0x0000000000000000000000000000000000000000";

	if (revoked) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.owner_address} />
				<Action type="revoked">revoked approval</Action>
				<span>for</span>
				<Account chain={chain} address={props.event.token_address} />
				<TokenId token_id={props.event.token_id} />
				<span>to be transferred</span>
			</Description>
		);
	}

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.owner_address} />
			<Action type="approved">approved</Action>
			<Account chain={chain} address={props.event.spender_address} />
			<span>to transfer</span>
			<Account chain={chain} address={props.event.token_address} />
			<TokenId token_id={props.event.token_id} />
		</Description>
	);
}

export function Erc721ApprovalV3AccountDescription(props: { event: Erc721ApprovalV3; account: IAccount }) {
	const chain = parseId(props.event.id).chainId;
	const revoked = props.event.spender_address === "0x0000000000000000000000000000000000000000";

	if (isAddressEqual(props.account.address, props.event.owner_address)) {
		if (revoked) {
			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Action type="revoked">Revoked approval</Action>
					<span>for</span>
					<Account chain={chain} address={props.event.token_address} />
					<TokenId token_id={props.event.token_id} />
					<span>to be transferred</span>
				</Description>
			);
		}

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="approved">Approved</Action>
				<Account chain={chain} address={props.event.spender_address} />
				<span>to transfer</span>
				<Account chain={chain} address={props.event.token_address} />
				<TokenId token_id={props.event.token_id} />
			</Description>
		);
	}

	if (isAddressEqual(props.account.address, props.event.spender_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="approved">Received approval</Action>
				<span>from</span>
				<Account chain={chain} address={props.event.owner_address} />
				<span>to transfer</span>
				<Account chain={chain} address={props.event.token_address} />
				<TokenId token_id={props.event.token_id} />
			</Description>
		);
	}

	return <Erc721ApprovalV3Description event={props.event} />;
}

function TokenId(props: { token_id: `0x${string}` }) {
	return <span>#{BigInt(props.token_id).toString()}</span>;
}
