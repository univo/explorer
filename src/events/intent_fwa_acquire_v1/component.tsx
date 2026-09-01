import { parseId } from "@/helpers";
import { ETH_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { hexToNumber, isHexEqual } from "@/utils";
import type { IntentFwaAcquireV1 } from "./event";
import { Description } from "@/components/description";
import { FWA_ADDRESS } from "@/events/intent_fwa_deposited_v1/event";

export function IntentFwaAcquireV1AccountDescription(props: { event: IntentFwaAcquireV1; address: `0x${string}` | undefined }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	const count = hexToNumber(props.event.acquisition_count);

	// (tx.from) purchaser_address

	if (isHexEqual(props.address, props.event.purchaser_address)) {
		return (
			<Description success={props.event.success}>
				<span>Submits intent to</span>
				<Action type="send">acquire</Action>
				<span>{count === 1 ? "a deposit" : `${count} deposits`}</span>
				<span>from</span>
				<Account chain={chain} address={FWA_ADDRESS} />
				<span>for</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.submitted_eth} at={blockTimestamp} />
			</Description>
		);
	}

	// (tx.to) FWA_ADDRESS

	if (isHexEqual(props.address, FWA_ADDRESS)) {
		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.purchaser_address} />
				<span>submits intent to</span>
				<Action type="send">acquire</Action>
				<span>{count === 1 ? "a deposit" : `${count} deposits`}</span>
				<span>for</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.submitted_eth} at={blockTimestamp} />
			</Description>
		);
	}

	return (
		<Description success={props.event.success}>
			<Account chain={chain} address={props.event.purchaser_address} />
			<span>submits intent to</span>
			<Action type="send">acquire</Action>
			<span>{count === 1 ? "a deposit" : `${count} deposits`}</span>
			<span>from</span>
			<Account chain={chain} address={FWA_ADDRESS} />
			<span>for</span>
			<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.submitted_eth} at={blockTimestamp} />
		</Description>
	);
}
