import { parseId } from "@/helpers";
import { isHexEqual } from "@/utils";
import { ZERO_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { IntentErc20ApprovalV1 } from "./event";
import { Description } from "@/components/description";

export function IntentErc20ApprovalV1AccountDescription(props: { event: IntentErc20ApprovalV1; address: `0x${string}` }) {
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	const all = props.event.quantity.length >= 30;
	const isZeroQuantity = BigInt(props.event.quantity) === 0n;
	const isSpenderNullAddress = isHexEqual(props.event.spender_address, ZERO_ADDRESS);

	const revoked = isZeroQuantity || isSpenderNullAddress;
	const quantity = !revoked && !all ? props.event.quantity : undefined;

	// (tx.from) owner_address

	if (isHexEqual(props.address, props.event.owner_address)) {
		if (revoked) {
			return (
				<Description success={props.event.success}>
					<Action type="revoke">Revoke</Action>
					<span>approval for</span>
					<Account chain={chain} address={props.event.spender_address} />
					<span>to spend any</span>
					<Erc20 chain={chain} address={props.event.token_address} quantity={quantity} at={blockTimestamp} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Action type="approve">Approve</Action>
				<Account chain={chain} address={props.event.spender_address} />
				<span>to spend</span>
				<span>{all === true ? "all" : "up to"}</span>
				<Erc20 chain={chain} address={props.event.token_address} quantity={quantity} at={blockTimestamp} />
			</Description>
		);
	}

	// spender_address

	if (isHexEqual(props.address, props.event.spender_address)) {
		if (revoked) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.owner_address} />
					<Action type="revoke">revokes</Action>
					<span>approval for this account to spend any</span>
					<Erc20 chain={chain} address={props.event.token_address} quantity={quantity} at={blockTimestamp} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.owner_address} />
				<Action type="approve">approves</Action>
				<span>this account to spend</span>
				<span>{all === true ? "all" : "up to"}</span>
				<Erc20 chain={chain} address={props.event.token_address} quantity={quantity} at={blockTimestamp} />
			</Description>
		);
	}

	// (tx.to) token_address

	if (revoked) {
		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.owner_address} />
				<Action type="revoke">revokes</Action>
				<span>approval for</span>
				<Account chain={chain} address={props.event.spender_address} />
				<span>to spend any</span>
				<Erc20 chain={chain} address={props.event.token_address} quantity={quantity} at={blockTimestamp} />
			</Description>
		);
	}

	return (
		<Description success={props.event.success}>
			<Account chain={chain} address={props.event.owner_address} />
			<Action type="approve">approves</Action>
			<Account chain={chain} address={props.event.spender_address} />
			<span>to spend</span>
			<span>{all === true ? "all" : "up to"}</span>
			<Erc20 chain={chain} address={props.event.token_address} quantity={quantity} at={blockTimestamp} />
		</Description>
	);
}
