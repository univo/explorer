import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { ETH_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Erc721 } from "@/components/erc-721";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import { FWA_ADDRESS, type IntentFwaDepositedV1 } from "./event";

export function IntentFwaDepositedV1Description(props: { event: IntentFwaDepositedV1 }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.depositor_address} />
			<Action type="deposited">deposited</Action>
			<Erc721 chain={chain} address={props.event.collection_address} id={props.event.token_id} />
			<span>into</span>
			<Account chain={chain} address={FWA_ADDRESS} />
			<span>with a backing of </span>
			<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.backing_eth} at={blockTimestamp} />
		</Description>
	);
}

export function IntentFwaDepositedV1AccountDescription(props: { event: IntentFwaDepositedV1; address: `0x${string}` }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	// From the perspective of the depositor

	if (isAddressEqual(props.address, props.event.depositor_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="deposited">Deposit</Action>
				<Erc721 chain={chain} address={props.event.collection_address} id={props.event.token_id} />
				<span>into</span>
				<Account chain={chain} address={FWA_ADDRESS} />
				<span>with a backing of</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.backing_eth} at={blockTimestamp} />
			</Description>
		);
	}

	return <IntentFwaDepositedV1Description event={props.event} />;
}
