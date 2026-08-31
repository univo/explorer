import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { formatNumber, isHexEqual } from "@/utils";
import { Description } from "@/components/description";
import type { IntentCancelPendingTxV1 } from "./event";

export function IntentCancelPendingTxV1AccountDescription(props: { event: IntentCancelPendingTxV1; address: `0x${string}` | undefined }) {
	const { chainId: chain } = parseId(props.event.id);

	// from_address: account cancelling the transaction

	if (isHexEqual(props.address, props.event.from_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="cancel">Cancel</Action>
				<span>pending transaction with nonce</span>
				<span>{formatNumber(BigInt(props.event.nonce))}</span>
			</Description>
		);
	}

	return (
		<Description success={props.event.success}>
			<Account chain={chain} address={props.event.from_address} />
			<Action type="cancel">cancels</Action>
			<span>pending transaction with nonce</span>
			<span>{formatNumber(BigInt(props.event.nonce))}</span>
		</Description>
	);
}
