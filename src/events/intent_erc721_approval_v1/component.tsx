import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { ZERO_ADDRESS } from "@/constants";
import { Action } from "@/components/action";
import { Erc721 } from "@/components/erc-721";
import { Account } from "@/components/account";
import { ExclamationIcon } from "@/components/icons";
import type { IntentErc721ApprovalV1 } from "./event";
import { Description } from "@/components/description";

export function IntentErc721ApprovalV1Description(props: { event: IntentErc721ApprovalV1 }) {
	const chain = parseId(props.event.id).chainId;

	if (isAddressEqual(props.event.spender_address, ZERO_ADDRESS)) {
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
		if (isAddressEqual(props.event.spender_address, ZERO_ADDRESS)) {
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
				<Action type="approved">Approved</Action>
				<Account chain={chain} address={props.event.spender_address} />
				<span>to transfer</span>
				<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
			</Description>
		);
	}

	return <IntentErc721ApprovalV1Description event={props.event} />;
}
