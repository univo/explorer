import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { Erc721TransferV3 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import type { Account as IAccount } from "@/state/account";

export function Erc721TransferV3Description(props: { event: Erc721TransferV3 }) {
	const chain = parseId(props.event.id).chainId;

	if (isAddressEqual(props.event.from_address, "0x0000000000000000000000000000000000000000")) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.to_address} />
				<Action type="minted">minted</Action>
				<Account chain={chain} address={props.event.token_address} />
				<TokenId token_id={props.event.token_id} />
			</Description>
		);
	}

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.from_address} />
			<Action type="sent">sent</Action>
			<Account chain={chain} address={props.event.token_address} />
			<TokenId token_id={props.event.token_id} />
			<span>to</span>
			<Account chain={chain} address={props.event.to_address} />
		</Description>
	);
}

export function Erc721TransferV3AccountDescription(props: { event: Erc721TransferV3; account: IAccount }) {
	const chain = parseId(props.event.id).chainId;

	if (isAddressEqual(props.account.address, props.event.from_address)) {
		if (isAddressEqual(props.event.to_address, "0x0000000000000000000000000000000000000000")) {
			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Action type="burnt">Burnt</Action>
					<Account chain={chain} address={props.event.token_address} />
					<TokenId token_id={props.event.token_id} />
				</Description>
			);
		}

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="sent">Sent</Action>
				<Account chain={chain} address={props.event.token_address} />
				<TokenId token_id={props.event.token_id} />
				<span>to</span>
				<Account chain={chain} address={props.event.to_address} />
			</Description>
		);
	}

	if (isAddressEqual(props.account.address, props.event.to_address)) {
		if (isAddressEqual(props.event.from_address, "0x0000000000000000000000000000000000000000")) {
			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Action type="received">Received</Action>
					<span>freshly minted</span>
					<TokenId token_id={props.event.token_id} />
					<Account chain={chain} address={props.event.token_address} />
				</Description>
			);
		}

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="received">Received</Action>
				<Account chain={chain} address={props.event.token_address} />
				<TokenId token_id={props.event.token_id} />
				<span>from</span>
				<Account chain={chain} address={props.event.from_address} />
			</Description>
		);
	}

	return <Erc721TransferV3Description event={props.event} />;
}

function TokenId(props: { token_id: `0x${string}` }) {
	return <span>#{BigInt(props.token_id).toString()}</span>;
}
