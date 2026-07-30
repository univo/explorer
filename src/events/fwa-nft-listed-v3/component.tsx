import { parseId } from "@/helpers";
import { ETH_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Erc721 } from "@/components/erc-721";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { Description } from "@/components/description";
import type { FwaNftListedV3 } from "./event";
import { FWA_ADDRESS } from "@/events/fwa-nft-deposited-v3/event";

export function FwaNftListedV3Description(props: { event: FwaNftListedV3 }) {
	const chain = parseId(props.event.id).chainId;

	return (
		<Description>
			<Account chain={chain} address={props.event.depositor_address} />
			<Action type="listed">listed</Action>
			<Erc721 chain={chain} address={props.event.collection_address} id={props.event.token_id} />
			<span>on</span>
			<Account chain={chain} address={FWA_ADDRESS} />
			<span>with</span>
			<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.backing_eth} />
			<span>backing</span>
		</Description>
	);
}
