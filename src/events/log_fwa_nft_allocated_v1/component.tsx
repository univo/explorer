import { parseId } from "@/helpers";
import { isHexEqual } from "@/utils";
import { ETH_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Erc721 } from "@/components/erc-721";
import { Account } from "@/components/account";
import type { LogFwaNftAllocatedV1 } from "./event";
import { Description } from "@/components/description";
import { FWA_ADDRESS } from "@/events/intent_fwa_deposited_v1/event";
import { getFwaListingById } from "@/events/log_fwa_nft_listed_v1/event";

export async function LogFwaNftAllocatedV1Description(props: { event: LogFwaNftAllocatedV1; address: `0x${string}` | undefined }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	const listing = await getFwaListingById(props.event.listing_id);

	if (listing === null) {
		throw new Error("Expected allocated NFT to have been listed already");
	}

	// purchaser_address, depositor_address

	// We do something slightly unique with this log event. FWA is designed in a way that it doesn't directly
	// react to external events, and rather runs at its own pace. This is correct and good system design, but
	// slightly complicates indexing. Users submit their intent to win (acquire) a deposit. The result of this
	// bet isn't actually fulfilled until a later transaction where FWA processes those acquisitions as capacity
	// from Chainlink's VRF becomes available. We want this result to show for both the winner (purchaser_address)
	// and the loser (depositor_address). This is why we also add the log event to our account index. The below
	// two cases are handling when we show that event for each of those accounts.

	if (isHexEqual(props.address, props.event.purchaser_address)) {
		return (
			<Description>
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
			<Description>
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
		<Description>
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
