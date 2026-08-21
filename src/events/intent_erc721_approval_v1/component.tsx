import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Erc721 } from "@/components/erc-721";
import { Account } from "@/components/account";
import type { IntentErc721ApprovalV1 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";

export function IntentErc721ApprovalV1Description(props: { event: IntentErc721ApprovalV1 }) {
	const chain = parseId(props.event.id).chainId;

	if (props.event.token_id === null) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.caller_address} />
				<Action type={props.event.approved ? "approved" : "revoked"}>{props.event.approved ? "approved" : "revoked approval for"}</Action>
				<Account chain={chain} address={props.event.spender_address} />
				<span>to transfer all NFTs from</span>
				<Account chain={chain} address={props.event.token_address} />
			</Description>
		);
	}

	if (props.event.approved === false) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.caller_address} />
				<Action type="revoked">revoked approval</Action>
				<span>for</span>
				<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
				<span>to be transferred</span>
			</Description>
		);
	}

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.caller_address} />
			<Action type="approved">approved</Action>
			<Account chain={chain} address={props.event.spender_address} />
			<span>to transfer</span>
			<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
		</Description>
	);
}

export function IntentErc721ApprovalV1AccountDescription(props: {
	event: IntentErc721ApprovalV1;
	address: `0x${string}`;
}) {
	const chain = parseId(props.event.id).chainId;

	if (isAddressEqual(props.address, props.event.caller_address)) {
		if (props.event.token_id !== null && props.event.approved === false) {
			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Action type="revoked">Revoked approval</Action>
					<span>for</span>
					<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
					<span>to be transferred</span>
				</Description>
			);
		}

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type={props.event.approved ? "approved" : "revoked"}>{props.event.approved ? "Approved" : "Revoked approval for"}</Action>
				<Account chain={chain} address={props.event.spender_address} />
				<span>{props.event.token_id === null ? "to transfer all NFTs from" : "to transfer"}</span>
				{props.event.token_id === null ? (
					<Account chain={chain} address={props.event.token_address} />
				) : (
					<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
				)}
			</Description>
		);
	}

	return <IntentErc721ApprovalV1Description event={props.event} />;
}
