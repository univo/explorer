import { parseId } from "@/helpers";
import type { IntentFwaWonV1 } from "./event";
import { ETH_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Erc721 } from "@/components/erc-721";
import { Account } from "@/components/account";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import { FWA_ADDRESS } from "../intent_fwa_deposited_v1/event";
import { getLogFwaNftListedV1ByListingId } from "../log_fwa_nft_listed_v1/event";

const FWA_TOKEN_ADDRESS = "0xa0Df17B5aC76ABaBA36E1450E2cbCd18A620C845";

export async function IntentFwaWonV1Description(props: { event: IntentFwaWonV1 }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	const listing = await getLogFwaNftListedV1ByListingId(props.event.listing_id);

	if (listing === null) {
		throw new Error("Expected listing to be activated if it was included in a position settled event");
	}

	if (props.event.settlement_type === "kept") {
		// We define the worth of the NFT as the initial backing provided because the payout
		// amount for a win deducts fees that are returned to the protocol

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.purchaser_address} />
				<Action type="won">won</Action>
				<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
				<span>worth</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={listing.backing_eth} at={blockTimestamp} />
			</Description>
		);
	}

	if (props.event.settlement_type === "relisted") {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.purchaser_address} />
				<Action type="won">won</Action>
				<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
				<span>worth</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={listing.backing_eth} at={blockTimestamp} />
				<span>and immediately relisted it back in</span>
				<Account chain={chain} address={FWA_ADDRESS} />
			</Description>
		);
	}

	if (props.event.settlement_type === "accepted_eth") {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.purchaser_address} />
				<Action type="won">won</Action>
				<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
				<span>but accepted the payout of</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.payout_eth} at={blockTimestamp} />
				<span>instead</span>
			</Description>
		);
	}

	if (props.event.settlement_type === "accepted_fwa") {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.purchaser_address} />
				<Action type="won">won</Action>
				<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
				<span>but accepted the payout of</span>
				<Erc20 chain={chain} address={FWA_TOKEN_ADDRESS} quantity={props.event.token_out} at={blockTimestamp} />
				<span>instead</span>
			</Description>
		);
	}
}

export function IntentFwaWonV1AccountDescription(props: { event: IntentFwaWonV1; address: `0x${string}` }) {
	return <IntentFwaWonV1Description event={props.event} />;
}
