import { parseId } from "@/helpers";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { LogErc20ApprovalV1 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";

export function LogErc20ApprovalV1Description(props: { event: LogErc20ApprovalV1; address: `0x${string}` | undefined }) {
	const all = props.event.quantity.length >= 30;
	const { chainId: chain, blockTimestamp } = parseId(props.event.id);

	const isZeroQuantity = BigInt(props.event.quantity) === 0n;
	const isSpenderNullAddress = props.event.spender_address === "0x0000000000000000000000000000000000000000";
	const revoked = isZeroQuantity || isSpenderNullAddress;

	if (revoked) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.owner_address} />
				<Action type="revoke">revoked</Action>
				<span>approval for</span>
				<Account chain={chain} address={props.event.spender_address} />
				<span>to spend any</span>
				<Erc20 chain={chain} address={props.event.token_address} at={blockTimestamp} />
			</Description>
		);
	}

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.owner_address} />
			<Action type="approve">approved</Action>
			<Account chain={chain} address={props.event.spender_address} />
			<span>to spend</span>
			{all === true && <span>all</span>}
			<Erc20 chain={chain} address={props.event.token_address} quantity={all ? undefined : props.event.quantity} at={blockTimestamp} />
		</Description>
	);
}
