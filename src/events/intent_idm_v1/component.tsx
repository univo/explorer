import { parseId } from "@/helpers";
import type { IntentIdmV1 } from "./event";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { isHexEqual, unreachable } from "@/utils";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";

export function IntentIdmV1AccountDescription(props: { event: IntentIdmV1; address: `0x${string}` }) {
	const chain = parseId(props.event.id).chainId;

	// (tx.from) from_address

	if (isHexEqual(props.address, props.event.from_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="sent">Send</Action>
				<span>message to</span>
				<Account chain={chain} address={props.event.to_address} />
				<span>"{props.event.message}"</span>
			</Description>
		);
	}

	// (tx.to) to_address

	if (isHexEqual(props.address, props.event.to_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="sent">Receive</Action>
				<span>message from</span>
				<Account chain={chain} address={props.event.from_address} />
				<span>"{props.event.message}"</span>
			</Description>
		);
	}

	unreachable();
}
