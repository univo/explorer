import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { Token } from "@/components/token";
import { Action } from "@/components/action";
import type { Erc20TransferV1 } from "./event";
import { Account } from "@/components/account";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import type { Account as IAccount } from "@/state/account";

export function Erc20TransferV1Description(props: { event: Erc20TransferV1 }) {
	const chain = parseId(props.event.id).chain_id;

	if (isAddressEqual(props.event.from_address, "0x0000000000000000000000000000000000000000")) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.to_address} />
				<Action type="minted">minted</Action>
				<Token chain={chain} address={props.event.token_address} quantity={props.event.quantity} />
			</Description>
		);
	}

	if (isAddressEqual(props.event.to_address, "0x0000000000000000000000000000000000000000")) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.from_address} />
				<Action type="burnt">burnt</Action>
				<Token chain={chain} address={props.event.token_address} quantity={props.event.quantity} />
			</Description>
		);
	}

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.from_address} />
			<Action type="sent">sent</Action>
			<Token chain={chain} address={props.event.token_address} quantity={props.event.quantity} />
			<span>to</span>
			<Account chain={chain} address={props.event.to_address} />
		</Description>
	);
}

export function Erc20TransferV1AccountDescription(props: { event: Erc20TransferV1; account: IAccount }) {
	const chain = parseId(props.event.id).chain_id;

	if (isAddressEqual(props.account.address, props.event.from_address)) {
		if (isAddressEqual(props.event.to_address, "0x0000000000000000000000000000000000000000")) {
			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Action type="burnt">Burnt</Action>
					<Token chain={chain} address={props.event.token_address} quantity={props.event.quantity} />
				</Description>
			);
		}

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="sent">Sent</Action>
				<Token chain={chain} address={props.event.token_address} quantity={props.event.quantity} />
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
					<Action type="minted">Minted</Action>
					<Token chain={chain} address={props.event.token_address} quantity={props.event.quantity} />
				</Description>
			);
		}

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="received">Received</Action>
				<Token chain={chain} address={props.event.token_address} quantity={props.event.quantity} />
				<span>from</span>
				<Account chain={chain} address={props.event.from_address} />
			</Description>
		);
	}

	return <Erc20TransferV1Description event={props.event} />;
}
