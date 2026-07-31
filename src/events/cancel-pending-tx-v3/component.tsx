import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { formatNumber } from "@/utils";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { CancelPendingTxV3 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";

export function CancelPendingTxV3Description(props: { event: CancelPendingTxV3 }) {
	const chain = parseId(props.event.id).chainId;

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.from_address} />
			<Action type="cancelled">cancelled</Action>
			<span>pending transaction with nonce</span>
			<span>{formatNumber(BigInt(props.event.nonce))}</span>
		</Description>
	);
}

export function CancelPendingTxV3AccountDescription(props: { event: CancelPendingTxV3; address: `0x${string}` }) {
	if (isAddressEqual(props.address, props.event.from_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="cancelled">Cancelled</Action>
				<span>pending transaction with nonce</span>
				<span>{formatNumber(BigInt(props.event.nonce))}</span>
			</Description>
		);
	}

	return <CancelPendingTxV3Description event={props.event} />;
}
