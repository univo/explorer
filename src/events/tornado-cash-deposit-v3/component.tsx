import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { numberToHex } from "@/utils";
import { Token } from "@/components/token";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import type { Account as IAccount } from "@/state/account";
import { getTornadoCashPool, type TornadoCashDepositV3 } from "./event";

export function TornadoCashDepositV3Description(props: { event: TornadoCashDepositV3 }) {
	const chain = parseId(props.event.id).chainId;
	const pool = getTornadoCashPool(props.event.pool_address);

	if (pool === undefined) {
		throw new Error(`Unknown Tornado Cash pool: ${props.event.pool_address}`);
	}

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.from_address} />
			<Action type="sent">deposited</Action>
			<Token chain={chain} address={pool.asset} quantity={numberToHex(pool.quantity)} />
			<span>to Tornado Cash</span>
			<Account chain={chain} address={props.event.pool_address} />
		</Description>
	);
}

export function TornadoCashDepositV3AccountDescription(props: { event: TornadoCashDepositV3; account: IAccount }) {
	const chain = parseId(props.event.id).chainId;
	const pool = getTornadoCashPool(props.event.pool_address);

	if (pool === undefined) {
		throw new Error(`Unknown Tornado Cash pool: ${props.event.pool_address}`);
	}

	if (isAddressEqual(props.account.address, props.event.from_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="sent">Deposited</Action>
				<Token chain={chain} address={pool.asset} quantity={numberToHex(pool.quantity)} />
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
				<Token chain={chain} address={pool.asset} quantity={numberToHex(pool.quantity)} />
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
				<Token chain={chain} address={pool.asset} quantity={numberToHex(pool.quantity)} />
				<span>to Tornado Cash</span>
				<Account chain={chain} address={props.event.pool_address} />
			</Description>
		);
	}

	return <TornadoCashDepositV3Description event={props.event} />;
}
