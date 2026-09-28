import { isHexEqual } from "@/utils";
import { ETH_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { getExternalChain } from "@/helpers";
import { Account } from "@/components/account";
import type { IntentNativeTransferV2 } from "./event";
import { Description } from "@/components/description";

export function IntentNativeTransferV2AccountDescription(props: { event: IntentNativeTransferV2; address: `0x${string}` | undefined }) {
	const chain = getExternalChain(props.event.chain);
	const at = props.event.block_timestamp.getTime() / 1000;

	// (tx.from) from_address

	if (isHexEqual(props.address, props.event.from_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="send">Send</Action>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.quantity} at={at} />
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
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.quantity} at={at} />
				<span>from</span>
				<Account chain={chain} address={props.event.from_address} />
			</Description>
		);
	}

	return (
		<Description success={props.event.success}>
			<Account chain={chain} address={props.event.from_address} />
			<Action type="send">sends</Action>
			<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.quantity} at={at} />
			<span>to</span>
			<Account chain={chain} address={props.event.to_address} />
		</Description>
	);
}
