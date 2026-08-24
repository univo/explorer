import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { ETH_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { IntentNativeTransferV1 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";

export function IntentNativeTransferV1Description(props: { event: IntentNativeTransferV1 }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.from_address} />
			<Action type="sent">sent</Action>
			<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.quantity} at={blockTimestamp} />
			<span>to</span>
			<Account chain={chain} address={props.event.to_address} />
		</Description>
	);
}

export function IntentNativeTransferV1AccountDescription(props: {
	event: IntentNativeTransferV1;
	address: `0x${string}`;
}) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	if (isAddressEqual(props.address, props.event.from_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="sent">Send</Action>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.quantity} at={blockTimestamp} />
				<span>to</span>
				<Account chain={chain} address={props.event.to_address} />
			</Description>
		);
	}

	if (isAddressEqual(props.address, props.event.to_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="received">Receive</Action>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.quantity} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={props.event.from_address} />
			</Description>
		);
	}

	return <IntentNativeTransferV1Description event={props.event} />;
}
