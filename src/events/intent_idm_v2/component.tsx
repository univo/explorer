import { isHexEqual } from "@/utils";
import { Action } from "@/components/action";
import { getExternalChain } from "@/helpers";
import { Account } from "@/components/account";
import type { IntentIdmV2 } from "./event";
import { Description } from "@/components/description";

export function IntentIdmV2AccountDescription(props: { event: IntentIdmV2; address: `0x${string}` | undefined }) {
	const chain = getExternalChain(props.event.chain);

	// (tx.from) from_address

	if (isHexEqual(props.address, props.event.from_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="send">Send</Action>
				<span>message to</span>
				<Account chain={chain} address={props.event.to_address} />
				<span>"{props.event.message}"</span>
			</Description>
		);
	}

	// (tx.to) to_address

	if (isHexEqual(props.address, props.event.to_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="send">Receive</Action>
				<span>message from</span>
				<Account chain={chain} address={props.event.from_address} />
				<span>"{props.event.message}"</span>
			</Description>
		);
	}

	return (
		<Description success={props.event.success}>
			<Action type="send">Send</Action>
			<span>message from</span>
			<Account chain={chain} address={props.event.from_address} />
			<span>to</span>
			<Account chain={chain} address={props.event.to_address} />
			<span>"{props.event.message}"</span>
		</Description>
	);
}
