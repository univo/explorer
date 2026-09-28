import { isHexEqual } from "@/utils";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { getExternalChain } from "@/helpers";
import { Account } from "@/components/account";
import type { IntentErc20TransferV2 } from "./event";
import { Description } from "@/components/description";

export function IntentErc20TransferV2AccountDescription(props: { event: IntentErc20TransferV2; address: `0x${string}` | undefined }) {
	const chain = getExternalChain(props.event.chain);
	const blockTimestamp = props.event.block_timestamp.getTime() / 1000;

	// (tx.from) from_address

	if (isHexEqual(props.address, props.event.from_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="send">Send</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
				<span>to</span>
				<Account chain={chain} address={props.event.to_address} />
			</Description>
		);
	}

	// transfer recipient

	if (isHexEqual(props.address, props.event.to_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="receive">Receive</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={props.event.from_address} />
			</Description>
		);
	}

	return (
		<Description success={props.event.success}>
			<Account chain={chain} address={props.event.from_address} />
			<Action type="send">sends</Action>
			<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
			<span>to</span>
			<Account chain={chain} address={props.event.to_address} />
		</Description>
	);
}
