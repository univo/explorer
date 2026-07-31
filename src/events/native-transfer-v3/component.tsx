import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { ETH_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { NativeTransferV3 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";

export function NativeTransferV3Description(props: { event: NativeTransferV3 }) {
	const chain = parseId(props.event.id).chainId;

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.from_address} />
			<Action type="sent">sent</Action>
			<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.quantity} />
			<span>to</span>
			<Account chain={chain} address={props.event.to_address} />
		</Description>
	);
}

export function NativeTransferV3AccountDescription(props: { event: NativeTransferV3; address: `0x${string}` }) {
	const chain = parseId(props.event.id).chainId;

	if (isAddressEqual(props.address, props.event.from_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="sent">Sent</Action>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.quantity} />
				<span>to</span>
				<Account chain={chain} address={props.event.to_address} />
			</Description>
		);
	}

	if (isAddressEqual(props.address, props.event.to_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="received">Received</Action>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.quantity} />
				<span>from</span>
				<Account chain={chain} address={props.event.from_address} />
			</Description>
		);
	}

	return <NativeTransferV3Description event={props.event} />;
}
