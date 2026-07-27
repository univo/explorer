import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { Erc20 } from "@/components/erc-20";
import { getTornadoCashPool } from "./event";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import type { TornadoCashWithdrawalV3 } from "./event";
import type { Account as IAccount } from "@/state/account";

export function TornadoCashWithdrawalV3Description(props: { event: TornadoCashWithdrawalV3 }) {
	const chain = parseId(props.event.id).chainId;
	const pool = getTornadoCashPool(props.event.pool_address);

	if (pool === undefined) {
		throw new Error(`Unknown Tornado Cash pool: ${props.event.pool_address}`);
	}

	// Users can withdraw directly from tornado.cash but it kind of defeats the purpose because
	// to make that tx they will need to fund their wallet some other way. We check for this
	// self-submitted case by looking at whether the tx.from address is also the recipient. In
	// this case the relayer is irrelevant and may be the recipient, zero address, or another address

	if (isAddressEqual(props.event.from_address, props.event.recipient_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.from_address} />
				<Action type="received">withdrew</Action>
				<Erc20 chain={chain} address={pool.asset} quantity={pool.quantity} />
				<span>from</span>
				<Account chain={chain} address={props.event.pool_address} />
			</Description>
		);
	}

	// However, most txs use a relay to perform the withdrawal. The relay is responsible for paying
	// gas costs and sending the funds. This means the user doesn't have to pre-fund an account with
	// gas money and maximises privacy (but incurs a fee for processing)

	const quantityAfterFees = BigInt(pool.quantity) - BigInt(props.event.fee);

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.from_address} />
			<Action type="received">withdrew</Action>
			<Erc20 chain={chain} address={pool.asset} quantity={quantityAfterFees} />
			<span>to</span>
			<Account chain={chain} address={props.event.recipient_address} />
			<span>from</span>
			<Account chain={chain} address={props.event.pool_address} />
			<span>via relay</span>
			<Account chain={chain} address={props.event.relayer_address} />
		</Description>
	);
}

export function TornadoCashWithdrawalV3AccountDescription(props: {
	event: TornadoCashWithdrawalV3;
	account: IAccount;
}) {
	const chain = parseId(props.event.id).chainId;
	const pool = getTornadoCashPool(props.event.pool_address);

	if (pool === undefined) {
		throw new Error(`Unknown Tornado Cash pool: ${props.event.pool_address}`);
	}

	// 1. From the perspective of the recipient

	if (isAddressEqual(props.account.address, props.event.recipient_address)) {
		// 1.1. Self-submission

		if (isAddressEqual(props.event.from_address, props.event.recipient_address)) {
			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Action type="received">Withdrew</Action>
					<Erc20 chain={chain} address={pool.asset} quantity={pool.quantity} />
					<span>from</span>
					<Account chain={chain} address={props.event.pool_address} />
				</Description>
			);
		}

		// 1.2. Recipient did not initiate the withdrawal and just received it via relayer

		const quantityAfterFees = BigInt(pool.quantity) - BigInt(props.event.fee);

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="received">Received</Action>
				<Erc20 chain={chain} address={pool.asset} quantity={quantityAfterFees} />
				<span>from</span>
				<Account chain={chain} address={props.event.pool_address} />
				<span>via relay</span>
				<Account chain={chain} address={props.event.relayer_address} />
			</Description>
		);
	}

	// 2. From the perspective of the relayer

	if (isAddressEqual(props.account.address, props.event.relayer_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<span>Relayed</span>
				<Action type="sent">withdrawal</Action>
				<span>of</span>
				<Erc20 chain={chain} address={pool.asset} quantity={pool.quantity} />
				<span>from</span>
				<Account chain={chain} address={props.event.pool_address} />
				<span>by</span>
				<Account chain={chain} address={props.event.from_address} />
				<span>to</span>
				<Account chain={chain} address={props.event.recipient_address} />
				<span>for a fee of</span>
				<Erc20 chain={chain} address={pool.asset} quantity={props.event.fee} />
			</Description>
		);
	}

	return <TornadoCashWithdrawalV3Description event={props.event} />;
}
