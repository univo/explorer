import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { InputDataMessageV3 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import type { Account as IAccount } from "@/state/account";

export function InputDataMessageV3Description(props: { event: InputDataMessageV3 }) {
	const chain = parseId(props.event.id).chainId;

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Action type="sent">Message sent from</Action>
			<Account chain={chain} address={props.event.from_address} />
			<span>to</span>
			<Account chain={chain} address={props.event.to_address} />
			<span>"{props.event.message}"</span>
		</Description>
	);
}

export function InputDataMessageV3AccountDescription(props: { event: InputDataMessageV3; account: IAccount }) {
	const chain = parseId(props.event.id).chainId;
	if (isAddressEqual(props.account.address, props.event.from_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="sent">Sent message to</Action>
				<Account chain={chain} address={props.event.to_address} />
				<span>"{props.event.message}"</span>
			</Description>
		);
	}

	if (isAddressEqual(props.account.address, props.event.to_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="sent">Received message from</Action>
				<Account chain={chain} address={props.event.from_address} />
				<span>"{props.event.message}"</span>
			</Description>
		);
	}

	return <InputDataMessageV3Description event={props.event} />;
}
