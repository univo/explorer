import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { formatNumber } from "@/utils";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { CancelPendingTxV2 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import type { Account as IAccount } from "@/state/account";

export function CancelPendingTxV2Description(props: { event: CancelPendingTxV2 }) {
	const chain = parseId(props.event.id).chain_id;

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.from_address} />
			<Action type="cancelled">cancelled</Action>
			<span>pending transaction with nonce</span>
			<span>{formatNumber(props.event.nonce)}</span>
		</Description>
	);
}

export function CancelPendingTxV2AccountDescription(props: { event: CancelPendingTxV2; account: IAccount }) {
	if (isAddressEqual(props.account.address, props.event.from_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="cancelled">Cancelled</Action>
				<span>pending transaction with nonce</span>
				<span>{formatNumber(props.event.nonce)}</span>
			</Description>
		);
	}

	return <CancelPendingTxV2Description event={props.event} />;
}
