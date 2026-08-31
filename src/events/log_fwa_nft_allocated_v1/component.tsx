import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Erc721 } from "@/components/erc-721";
import { Account } from "@/components/account";
import type { LogFwaNftAllocatedV1 } from "./event";
import { Description } from "@/components/description";
import { FWA_ADDRESS } from "@/events/intent_fwa_deposited_v1/event";
import { getFwaListingById } from "@/events/log_fwa_nft_listed_v1/event";

export async function LogFwaNftAllocatedV1Description(props: { event: LogFwaNftAllocatedV1 }) {
	const { chainId: chain } = parseId(props.event.id);

	const listing = await getFwaListingById(props.event.listing_id);

	if (listing === null) {
		throw new Error("Expected allocated NFT to have been listed already");
	}

	return (
		<Description>
			<Account chain={chain} address={props.event.purchaser_address} />
			<Action type="win">won</Action>
			<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
			<span>deposited by</span>
			<Account chain={chain} address={props.event.depositor_address} />
			<span>on</span>
			<Account chain={chain} address={FWA_ADDRESS} />
		</Description>
	);
}
