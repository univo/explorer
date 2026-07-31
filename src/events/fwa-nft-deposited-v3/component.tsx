import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { ETH_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Erc721 } from "@/components/erc-721";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import type { Account as IAccount } from "@/state/account";
import { FWA_ADDRESS, type FwaNftDepositedV3 } from "./event";

export function FwaNftDepositedV3Description(props: { event: FwaNftDepositedV3 }) {
	const chain = parseId(props.event.id).chainId;

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.depositor_address} />
			<Action type="deposited">deposited</Action>
			<Erc721 chain={chain} address={props.event.collection_address} id={props.event.token_id} />
			<span>into</span>
			<Account chain={chain} address={FWA_ADDRESS} />
			<span>with a backing of </span>
			<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.backing_eth} />
		</Description>
	);
}

export function FwaNftDepositedV3AccountDescription(props: { event: FwaNftDepositedV3; account: IAccount }) {
	const chain = parseId(props.event.id).chainId;

	// From the perspective of the depositor

	if (isAddressEqual(props.account.address, props.event.depositor_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="deposited">Deposited</Action>
				<Erc721 chain={chain} address={props.event.collection_address} id={props.event.token_id} />
				<span>into</span>
				<Account chain={chain} address={FWA_ADDRESS} />
				<span>with a backing of</span>
				<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.backing_eth} />
			</Description>
		);
	}

	return <FwaNftDepositedV3Description event={props.event} />;
}
