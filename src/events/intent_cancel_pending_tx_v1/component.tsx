import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { formatNumber } from "@/utils";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import type { IntentCancelPendingTxV1 } from "./event";

export function IntentCancelPendingTxV1Description(props: { event: IntentCancelPendingTxV1 }) {
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

export function IntentCancelPendingTxV1AccountDescription(props: {
	event: IntentCancelPendingTxV1;
	address: `0x${string}`;
}) {
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

	return <IntentCancelPendingTxV1Description event={props.event} />;
}
