import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { Token } from "@/components/token";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { Erc20TransferV2 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import type { Account as IAccount } from "@/state/account";

export function Erc20TransferV2Description(props: { event: Erc20TransferV2 }) {
	const chain = parseId(props.event.id).chainId;

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

export function Erc20TransferV2AccountDescription(props: { event: Erc20TransferV2; account: IAccount }) {
	const chain = parseId(props.event.id).chainId;

	if (isAddressEqual(props.account.address, props.event.from_address)) {
		if (isBurnAddress(props.event.to_address)) {
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
		if (isBurnAddress(props.event.from_address)) {
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

	return <Erc20TransferV2Description event={props.event} />;
}

const BURN_ADDRESSES = [
	"0x0000000000000000000000000000000000000000", //
	"0x000000000000000000000000000000000000dEaD",
];

function isBurnAddress(address: `0x${string}`) {
	return BURN_ADDRESSES.some((burn) => isAddressEqual(address, burn as `0x${string}`));
}
