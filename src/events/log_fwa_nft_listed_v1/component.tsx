import { parseId } from "@/helpers";
import { ETH_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Erc721 } from "@/components/erc-721";
import { Account } from "@/components/account";
import type { LogFwaNftListedV1 } from "./event";
import { Description } from "@/components/description";
import { FWA_ADDRESS } from "@/events/intent_fwa_deposited_v1/event";

export function LogFwaNftListedV1Description(props: { event: LogFwaNftListedV1 }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	return (
		<Description>
			<Account chain={chain} address={props.event.depositor_address} />
			<Erc721 chain={chain} address={props.event.collection_address} id={props.event.token_id} />
			<Action type="deposited">listed</Action>
			<span>on</span>
			<Account chain={chain} address={FWA_ADDRESS} />
			<span>for a backing of</span>
			<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.backing_eth} at={blockTimestamp} />
		</Description>
	);
}
