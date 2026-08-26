import { parseId } from "@/helpers";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { unreachable, isHexEqual } from "@/utils";
import type { IntentErc20TransferV1 } from "./event";
import { Description } from "@/components/description";

export function IntentErc20TransferV1AccountDescription(props: { event: IntentErc20TransferV1; address: `0x${string}` }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	// (tx.from) from_address

	if (isHexEqual(props.address, props.event.from_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="sent">Send</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
				<span>to</span>
				<Account chain={chain} address={props.event.to_address} />
			</Description>
		);
	}

	// (tx.to) to_address

	if (isHexEqual(props.address, props.event.to_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="received">Receive</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={props.event.from_address} />
			</Description>
		);
	}

	// token_address

	if (isHexEqual(props.address, props.event.token_address)) {
		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.from_address} />
				<Action type="sent">sends</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
				<span>to</span>
				<Account chain={chain} address={props.event.to_address} />
			</Description>
		);
	}

	unreachable();
}
