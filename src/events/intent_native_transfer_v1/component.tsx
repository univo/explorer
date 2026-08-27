import { parseId } from "@/helpers";
import { ETH_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { isHexEqual, unreachable } from "@/utils";
import type { IntentNativeTransferV1 } from "./event";
import { Description } from "@/components/description";

export function IntentNativeTransferV1AccountDescription(props: { event: IntentNativeTransferV1; address: `0x${string}` }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	// (tx.from) from_address

	if (isHexEqual(props.address, props.event.from_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="send">Send</Action>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.quantity} at={blockTimestamp} />
				<span>to</span>
				<Account chain={chain} address={props.event.to_address} />
			</Description>
		);
	}

	// (tx.to) to_address

	if (isHexEqual(props.address, props.event.to_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="receive">Receive</Action>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.quantity} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={props.event.from_address} />
			</Description>
		);
	}

	unreachable();
}
