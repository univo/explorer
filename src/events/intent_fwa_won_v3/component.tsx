import { isHexEqual } from "@/utils";
import { ETH_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import type { IntentFwaWonV3 } from "./event";
import { Erc721 } from "@/components/erc-721";
import { Account } from "@/components/account";
import { Description } from "@/components/description";
import { getExternalChain } from "@/helpers";
import { FWA_ADDRESS } from "../intent_fwa_deposited_v2/event";
import { getFwaListingById } from "../log_fwa_nft_listed_v2/event";

const FWA_TOKEN_ADDRESS = "0xa0Df17B5aC76ABaBA36E1450E2cbCd18A620C845";

export async function IntentFwaWonV3AccountDescription(props: { event: IntentFwaWonV3; address: `0x${string}` | undefined }) {
	const chain = getExternalChain(props.event.chain);
	const timestamp = props.event.block_timestamp.getTime() / 1000;

	const listing = await getFwaListingById(props.event.listing_id);

	if (listing === null) {
		throw new Error("Expected listing to be activated if it was included in a position settled event");
	}

	// (tx.from) purchaser_address: the account claiming that won the deposited NFT

	if (isHexEqual(props.address, props.event.purchaser_address)) {
		if (props.event.settlement_type === "relisted") {
			return (
				<Description success={props.event.success}>
					<Action type="win">Claim</Action>
					<span>winnings</span>
					<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
					<span>worth backing of</span>
					<Erc20 chain={chain} address={ETH_ADDRESS} quantity={listing.backing_eth} at={timestamp} />
					<span>and relist it on</span>
					<Account chain={chain} address={FWA_ADDRESS} />
				</Description>
			);
		}

		if (props.event.settlement_type === "accepted_fwa") {
			return (
				<Description success={props.event.success}>
					<Action type="win">Claim</Action>
					<span>winnings</span>
					<Erc20 chain={chain} address={FWA_TOKEN_ADDRESS} quantity={props.event.token_out} at={timestamp} />
					<span>from</span>
					<Account chain={chain} address={FWA_ADDRESS} />
				</Description>
			);
		}

		if (props.event.settlement_type === "accepted_eth") {
			return (
				<Description success={props.event.success}>
					<Action type="win">Claim</Action>
					<span>winnings</span>
					<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.payout_eth} at={timestamp} />
					<span>from</span>
					<Account chain={chain} address={FWA_ADDRESS} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Action type="win">Claim</Action>
				<span>winnings</span>
				<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
				<span>worth</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={listing.backing_eth} at={timestamp} />
				<span>from</span>
				<Account chain={chain} address={FWA_ADDRESS} />
			</Description>
		);
	}

	// (tx.to) FWA_ADDRESS: the FWA contract

	if (isHexEqual(props.address, FWA_ADDRESS)) {
		if (props.event.settlement_type === "relisted") {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.purchaser_address} />
					<Action type="win">claims</Action>
					<span>winnings</span>
					<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
					<span>worth backing of</span>
					<Erc20 chain={chain} address={ETH_ADDRESS} quantity={listing.backing_eth} at={timestamp} />
					<span>and relists it</span>
				</Description>
			);
		}

		if (props.event.settlement_type === "accepted_fwa") {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.purchaser_address} />
					<Action type="win">claims</Action>
					<span>winnings</span>
					<Erc20 chain={chain} address={FWA_TOKEN_ADDRESS} quantity={props.event.token_out} at={timestamp} />
				</Description>
			);
		}

		if (props.event.settlement_type === "accepted_eth") {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.purchaser_address} />
					<Action type="win">claims</Action>
					<span>winnings</span>
					<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.payout_eth} at={timestamp} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.purchaser_address} />
				<Action type="win">claims</Action>
				<span>winnings</span>
				<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
				<span>worth</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={listing.backing_eth} at={timestamp} />
			</Description>
		);
	}

	if (props.event.settlement_type === "relisted") {
		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.purchaser_address} />
				<Action type="win">claims</Action>
				<span>winnings</span>
				<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
				<span>worth backing of</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={listing.backing_eth} at={timestamp} />
				<span>and relists it on</span>
				<Account chain={chain} address={FWA_ADDRESS} />
			</Description>
		);
	}

	if (props.event.settlement_type === "accepted_fwa") {
		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.purchaser_address} />
				<Action type="win">claims</Action>
				<span>winnings</span>
				<Erc20 chain={chain} address={FWA_TOKEN_ADDRESS} quantity={props.event.token_out} at={timestamp} />
				<span>from</span>
				<Account chain={chain} address={FWA_ADDRESS} />
			</Description>
		);
	}

	if (props.event.settlement_type === "accepted_eth") {
		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.purchaser_address} />
				<Action type="win">claims</Action>
				<span>winnings</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.payout_eth} at={timestamp} />
				<span>from</span>
				<Account chain={chain} address={FWA_ADDRESS} />
			</Description>
		);
	}

	return (
		<Description success={props.event.success}>
			<Account chain={chain} address={props.event.purchaser_address} />
			<Action type="win">claims</Action>
			<span>winnings</span>
			<Erc721 chain={chain} address={listing.collection_address} id={listing.token_id} />
			<span>worth</span>
			<Erc20 chain={chain} address={ETH_ADDRESS} quantity={listing.backing_eth} at={timestamp} />
			<span>from</span>
			<Account chain={chain} address={FWA_ADDRESS} />
		</Description>
	);
}
