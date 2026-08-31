import { parseId } from "@/helpers";
import { Erc20 } from "@/components/erc-20";
import { getTornadoCashPool } from "./event";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { isHexEqual } from "@/utils";
import { Description } from "@/components/description";
import type { IntentTornadoWithdrawalV1 } from "./event";

export function IntentTornadoWithdrawalV1AccountDescription(props: {
	event: IntentTornadoWithdrawalV1;
	address: `0x${string}` | undefined;
}) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	const pool = getTornadoCashPool(props.event.pool_address);

	if (pool === undefined) {
		throw new Error(`Unknown Tornado Cash pool: ${props.event.pool_address}`);
	}

	// (tx.from) from_address: the account initiating the withdrawal

	if (isHexEqual(props.address, props.event.from_address, props.event.recipient_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="receive">Withdraw</Action>
				<Erc20 chain={chain} address={pool.asset} quantity={pool.quantity} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={props.event.pool_address} />
			</Description>
		);
	}

	// relayer_address: the account relaying the withdrawal

	if (isHexEqual(props.address, props.event.from_address, props.event.relayer_address)) {
		return (
			<Description success={props.event.success}>
				<span>Relay</span>
				<Action type="send">withdrawal</Action>
				<span>of</span>
				<Erc20 chain={chain} address={pool.asset} quantity={pool.quantity} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={props.event.pool_address} />
				<span>by</span>
				<Account chain={chain} address={props.event.from_address} />
				<span>to</span>
				<Account chain={chain} address={props.event.recipient_address} />
				<span>for a fee of</span>
				<Erc20 chain={chain} address={pool.asset} quantity={props.event.fee} at={blockTimestamp} />
			</Description>
		);
	}

	// recipient_address: the account receiving the funds. To get here means it's not the self-submission
	// case and we did not initiate the withdrawal and just received the funds via relay

	if (isHexEqual(props.address, props.event.recipient_address)) {
		const quantityAfterFees = BigInt(pool.quantity) - BigInt(props.event.fee);

		return (
			<Description success={props.event.success}>
				<Action type="receive">Receive</Action>
				<Erc20 chain={chain} address={pool.asset} quantity={quantityAfterFees} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={props.event.pool_address} />
				<span>via relay</span>
				<Account chain={chain} address={props.event.relayer_address} />
			</Description>
		);
	}

	// (tx.to) to_address: this is either the pool address or one of statically defined proxies.

	if (isHexEqual(props.address, props.event.to_address)) {
		if (isHexEqual(props.event.from_address, props.event.recipient_address)) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.from_address} />
					<Action type="withdraw">withdraws</Action>
					<Erc20 chain={chain} address={pool.asset} quantity={pool.quantity} at={blockTimestamp} />
				</Description>
			);
		}

		return (
			<Description>
				<Account chain={chain} address={props.event.recipient_address} />
				<Action type="withdraw">withdraws</Action>
				<Erc20 chain={chain} address={pool.asset} quantity={pool.quantity} at={blockTimestamp} />
				<span>via relay</span>
				<Account chain={chain} address={props.event.relayer_address} />
			</Description>
		);
	}

	// Users can withdraw directly from tornado.cash but it kind of defeats the purpose because
	// to make that tx they will need to fund their wallet with ETH some other way. We can check
	// for this self-submission case by looking at whether the tx.from address is also the recipient
	// of the funds. In this case the relayer is irrelevant and may be the recipient, zero address,
	// or another address

	if (isHexEqual(props.event.from_address, props.event.recipient_address)) {
		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.from_address} />
				<Action type="withdraw">withdraws</Action>
				<Erc20 chain={chain} address={pool.asset} quantity={pool.quantity} at={blockTimestamp} />
				<span>from</span>
				<Account chain={chain} address={props.event.pool_address} />
			</Description>
		);
	}

	// However, most txs use a relay to perform the withdrawal. The relay is responsible for paying
	// gas costs and sending the funds. This means the user doesn't have to pre-fund an account with
	// gas money and maximises privacy (but incurs a fee for processing).

	return (
		<Description>
			<Account chain={chain} address={props.event.recipient_address} />
			<Action type="withdraw">withdraws</Action>
			<Erc20 chain={chain} address={pool.asset} quantity={pool.quantity} at={blockTimestamp} />
			<span>from</span>
			<Account chain={chain} address={props.event.pool_address} />
			<span>via relay</span>
			<Account chain={chain} address={props.event.relayer_address} />
		</Description>
	);
}
