import { ETH_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { getExternalChain } from "@/helpers";
import { Account } from "@/components/account";
import { hexToNumber, isHexEqual } from "@/utils";
import type { IntentFwaAcquireV2 } from "./event";
import { Description } from "@/components/description";
import { FWA_ADDRESS } from "@/events/intent_fwa_deposited_v2/event";

export function IntentFwaAcquireV2AccountDescription(props: { event: IntentFwaAcquireV2; address: `0x${string}` | undefined }) {
	const chain = getExternalChain(props.event.chain);
	const timestamp = props.event.block_timestamp.getTime() / 1000;
	const count = hexToNumber(props.event.acquisition_count);

	// (tx.from) purchaser_address

	if (isHexEqual(props.address, props.event.purchaser_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="send">Submits</Action>
				<span>intent to acquire {count === 1 ? "a deposit" : `${count} deposits`} from</span>
				<Account chain={chain} address={FWA_ADDRESS} />
				<span>for</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.submitted_eth} at={timestamp} />
			</Description>
		);
	}

	// (tx.to) FWA_ADDRESS

	if (isHexEqual(props.address, FWA_ADDRESS)) {
		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.purchaser_address} />
				<Action type="send">submits</Action>
				<span>intent to acquire {count === 1 ? "a deposit" : `${count} deposits`} for</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.submitted_eth} at={timestamp} />
			</Description>
		);
	}

	return (
		<Description success={props.event.success}>
			<Account chain={chain} address={props.event.purchaser_address} />
			<Action type="send">submits</Action>
			<span>intent to acquire {count === 1 ? "a deposit" : `${count} deposits`} from</span>
			<Account chain={chain} address={FWA_ADDRESS} />
			<span>for</span>
			<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.submitted_eth} at={timestamp} />
		</Description>
	);
}
