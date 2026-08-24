import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Erc721 } from "@/components/erc-721";
import { Account } from "@/components/account";
import type { LogErc721ApprovalV1 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";

export function LogErc721ApprovalV1Description(props: { event: LogErc721ApprovalV1 }) {
	const chain = parseId(props.event.id).chainId;
	const revoked = props.event.spender_address === "0x0000000000000000000000000000000000000000";

	if (revoked) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.owner_address} />
				<Action type="revoked">revoked</Action>
				<span>approval for</span>
				<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
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
			<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
		</Description>
	);
}

export function LogErc721ApprovalV1AccountDescription(props: { event: LogErc721ApprovalV1; address: `0x${string}` }) {
	const chain = parseId(props.event.id).chainId;
	const revoked = props.event.spender_address === "0x0000000000000000000000000000000000000000";

	if (isAddressEqual(props.address, props.event.owner_address)) {
		if (revoked) {
			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Action type="revoked">Revoked</Action>
					<span>approval for</span>
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

	if (isAddressEqual(props.address, props.event.spender_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<span>Received</span>
				<Action type="approved">approval</Action>
				<span>from</span>
				<Account chain={chain} address={props.event.owner_address} />
				<span>to transfer</span>
				<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
			</Description>
		);
	}

	return <LogErc721ApprovalV1Description event={props.event} />;
}
