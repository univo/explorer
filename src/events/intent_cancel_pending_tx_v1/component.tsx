import { Action } from "@/components/action";
import { Description } from "@/components/description";
import type { IntentCancelPendingTxV1 } from "./event";
import { formatNumber, isHexEqual, unreachable } from "@/utils";

export function IntentCancelPendingTxV1AccountDescription(props: { event: IntentCancelPendingTxV1; address: `0x${string}` }) {
	if (isHexEqual(props.address, props.event.from_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="cancel">Cancel</Action>
				<span>pending transaction with nonce</span>
				<span>{formatNumber(BigInt(props.event.nonce))}</span>
			</Description>
		);
	}

	unreachable();
}
