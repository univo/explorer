import { isHexEqual } from "@/utils";
import { ETH_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Erc721 } from "@/components/erc-721";
import { Action } from "@/components/action";
import { getExternalChain } from "@/helpers";
import { Account } from "@/components/account";
import { Description } from "@/components/description";
import { FWA_ADDRESS, type IntentFwaDepositedV2 } from "./event";

export function IntentFwaDepositedV2AccountDescription(props: { event: IntentFwaDepositedV2; address: `0x${string}` | undefined }) {
	const chain = getExternalChain(props.event.chain);
	const timestamp = props.event.block_timestamp.getTime() / 1000;

	// (tx.from) depositer_address: the account performing the deposit

	if (isHexEqual(props.address, props.event.depositor_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="deposit">Deposit</Action>
				<Erc721 chain={chain} address={props.event.collection_address} id={props.event.token_id} />
				<span>into</span>
				<Account chain={chain} address={FWA_ADDRESS} />
				<span>with a backing of</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.backing_eth} at={timestamp} />
			</Description>
		);
	}

	// (tx.to) FWA_ADDRESS

	if (isHexEqual(props.address, FWA_ADDRESS)) {
		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.depositor_address} />
				<Action type="deposit">deposits</Action>
				<Erc721 chain={chain} address={props.event.collection_address} id={props.event.token_id} />
				<span>with a backing of</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.backing_eth} at={timestamp} />
			</Description>
		);
	}

	return (
		<Description success={props.event.success}>
			<Account chain={chain} address={props.event.depositor_address} />
			<Action type="deposit">deposits</Action>
			<Erc721 chain={chain} address={props.event.collection_address} id={props.event.token_id} />
			<span>into</span>
			<Account chain={chain} address={FWA_ADDRESS} />
			<span>with a backing of</span>
			<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.backing_eth} at={timestamp} />
		</Description>
	);
}
