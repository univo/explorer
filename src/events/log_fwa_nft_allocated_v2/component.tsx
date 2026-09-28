import { getExternalChain } from "@/helpers";
import { isHexEqual } from "@/utils";
import { ETH_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Erc721 } from "@/components/erc-721";
import { Account } from "@/components/account";
import type { LogFwaNftAllocatedV2 } from "./event";
import { Description } from "@/components/description";
import { FWA_ADDRESS } from "@/events/intent_fwa_deposited_v2/event";
import { getFwaListingById } from "@/events/log_fwa_nft_listed_v2/event";

export async function LogFwaNftAllocatedV2Description(props: { event: LogFwaNftAllocatedV2; address: `0x${string}` | undefined }) {
	const chain = getExternalChain(props.event.chain);
	const blockTimestamp = props.event.block_timestamp.getTime() / 1000;

	const listing = await getFwaListingById(props.event.listing_id);

	if (listing === null) {
		throw new Error("Expected allocated NFT to have been listed already");
	}

	// purchaser_address, depositor_address

	// Allocations settle asynchronously, so this event is shown for both the winner and the depositor.

	if (isHexEqual(props.address, props.event.purchaser_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="win">Won</Action>
				<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
				<span>worth</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.backing_eth} at={blockTimestamp} />
				<span>on</span>
				<Account chain={chain} address={FWA_ADDRESS} />
			</Description>
		);
	}

	if (isHexEqual(props.address, props.event.depositor_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="lose">Lost</Action>
				<span>deposit of</span>
				<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
				<span>worth</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.backing_eth} at={blockTimestamp} />
				<span>on</span>
				<Account chain={chain} address={FWA_ADDRESS} />
			</Description>
		);
	}

	return (
		<Description success={props.event.success}>
			<Account chain={chain} address={props.event.purchaser_address} />
			<Action type="win">won</Action>
			<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
			<span>worth</span>
			<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.backing_eth} at={blockTimestamp} />
			<span>deposited by</span>
			<Account chain={chain} address={props.event.depositor_address} />
			<span>on</span>
			<Account chain={chain} address={FWA_ADDRESS} />
		</Description>
	);
}
