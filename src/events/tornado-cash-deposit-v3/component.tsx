import { isAddressEqual } from "viem";

import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { TornadoCashDepositV3 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import { formatTokenAmount, parseId } from "@/helpers";
import type { Account as IAccount } from "@/state/account";

export function TornadoCashDepositV3Description(props: { event: TornadoCashDepositV3 }) {
	const chain = parseId(props.event.id).chainId;

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.from_address} />
			<Action type="sent">deposited</Action>
			<Amount event={props.event} />
			<span>to Tornado Cash</span>
			<Account chain={chain} address={props.event.pool_address} />
		</Description>
	);
}

export function TornadoCashDepositV3AccountDescription(props: { event: TornadoCashDepositV3; account: IAccount }) {
	const chain = parseId(props.event.id).chainId;

	if (isAddressEqual(props.account.address, props.event.from_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="sent">Deposited</Action>
				<Amount event={props.event} />
				<span>to Tornado Cash</span>
				<Account chain={chain} address={props.event.pool_address} />
			</Description>
		);
	}

	if (isAddressEqual(props.account.address, props.event.pool_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="received">Tornado Cash deposit</Action>
				<span>of</span>
				<Amount event={props.event} />
				<span>from</span>
				<Account chain={chain} address={props.event.from_address} />
			</Description>
		);
	}

	if (isAddressEqual(props.account.address, props.event.to_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="called">Processed deposit</Action>
				<span>of</span>
				<Amount event={props.event} />
				<span>to Tornado Cash</span>
				<Account chain={chain} address={props.event.pool_address} />
			</Description>
		);
	}

	return <TornadoCashDepositV3Description event={props.event} />;
}

function Amount(props: { event: TornadoCashDepositV3 }) {
	return (
		<>
			<span>{formatTokenAmount(props.event.quantity, props.event.asset_decimals)}</span>
			<span>{props.event.asset_symbol}</span>
		</>
	);
}
