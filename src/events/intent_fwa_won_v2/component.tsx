import { parseId } from "@/helpers";
import { isHexEqual } from "@/utils";
import { Action } from "@/components/action";
import type { IntentFwaWonV2 } from "./event";
import { Erc721 } from "@/components/erc-721";
import { Account } from "@/components/account";
import { Description } from "@/components/description";
import { FWA_ADDRESS } from "../intent_fwa_deposited_v1/event";
import { getFwaListingById } from "../log_fwa_nft_listed_v1/event";

// TODO: Show settlement type

export async function IntentFwaWonV2AccountDescription(props: { event: IntentFwaWonV2; address: `0x${string}` | undefined }) {
	const { chainId: chain } = parseId(props.event.id);

	const listing = await getFwaListingById(props.event.listing_id);

	if (listing === null) {
		throw new Error("Expected listing to be activated if it was included in a position settled event");
	}

	// (tx.from) purchaser_address: the account claiming that won the deposited NFT

	if (isHexEqual(props.address, props.event.purchaser_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="win">Claim</Action>
				<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
				<span>won on</span>
				<Account chain={chain} address={FWA_ADDRESS} />
			</Description>
		);
	}

	// (tx.to) FWA_ADDRESS: the FWA contract

	if (isHexEqual(props.address, FWA_ADDRESS)) {
		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.purchaser_address} />
				<Action type="win">claims</Action>
				<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
			</Description>
		);
	}

	return (
		<Description success={props.event.success}>
			<Account chain={chain} address={props.event.purchaser_address} />
			<Action type="win">claims</Action>
			<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
			<span>won from</span>
			<Account chain={chain} address={FWA_ADDRESS} />
		</Description>
	);
}
