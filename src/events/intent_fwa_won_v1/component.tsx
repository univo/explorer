import { parseId } from "@/helpers";
import { isHexEqual } from "@/utils";
import { Action } from "@/components/action";
import type { IntentFwaWonV1 } from "./event";
import { Erc721 } from "@/components/erc-721";
import { Account } from "@/components/account";
import { Description } from "@/components/description";
import { FWA_ADDRESS } from "../intent_fwa_deposited_v1/event";
import { getLogFwaNftListedV1ByListingId } from "../log_fwa_nft_listed_v1/event";

export async function IntentFwaWonV1AccountDescription(props: { event: IntentFwaWonV1; address: `0x${string}` }) {
	const { chainId: chain } = parseId(props.event.id);

	const listing = await getLogFwaNftListedV1ByListingId(props.event.listing_id);

	if (listing === null) {
		throw new Error("Expected listing to be activated if it was included in a position settled event");
	}

	// (tx.from) purchaser_address: the account claiming that won the deposited NFT

	if (isHexEqual(props.address, props.event.purchaser_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="win">Claim</Action>
				<span>winnings of</span>
				<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
				<span>from</span>
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
				<span>winnings of</span>
				<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
			</Description>
		);
	}

	// depositor_address: the account that lost their deposited NFT

	if (isHexEqual(props.address, props.event.depositor_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="lose">Lose</Action>
				<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
				<span>deposited into</span>
				<Account chain={chain} address={FWA_ADDRESS} />
			</Description>
		);
	}

	return (
		<Description success={props.event.success}>
			<Account chain={chain} address={props.event.purchaser_address} />
			<Action type="win">claims</Action>
			<span>winnings of</span>
			<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
			<span>from</span>
			<Account chain={chain} address={FWA_ADDRESS} />
		</Description>
	);
}
