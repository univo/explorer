import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { IntentIdmV1 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";

export function IntentIdmV1Description(props: { event: IntentIdmV1 }) {
	const chain = parseId(props.event.id).chainId;

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Action type="sent">Message sent</Action>
			<span>from</span>
			<Account chain={chain} address={props.event.from_address} />
			<span>to</span>
			<Account chain={chain} address={props.event.to_address} />
			<span>"{props.event.message}"</span>
		</Description>
	);
}

export function IntentIdmV1AccountDescription(props: { event: IntentIdmV1; address: `0x${string}` }) {
	const chain = parseId(props.event.id).chainId;
	if (isAddressEqual(props.address, props.event.from_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="sent">Sent message</Action>
				<span>to</span>
				<Account chain={chain} address={props.event.to_address} />
				<span>"{props.event.message}"</span>
			</Description>
		);
	}

	if (isAddressEqual(props.address, props.event.to_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="sent">Received message</Action>
				<span>from</span>
				<Account chain={chain} address={props.event.from_address} />
				<span>"{props.event.message}"</span>
			</Description>
		);
	}

	return <IntentIdmV1Description event={props.event} />;
}
