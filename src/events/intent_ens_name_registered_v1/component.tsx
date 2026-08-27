import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Description } from "@/components/description";
import type { IntentEnsNameRegisteredV1 } from "./event";

export function IntentEnsNameRegisteredV1AccountDescription(props: { event: IntentEnsNameRegisteredV1; address: `0x${string}` }) {
	const { blockTimestamp } = parseId(props.event.id);

	const expiry = BigInt(blockTimestamp) + BigInt(props.event.duration);

	const expiryFormatted = new Date(Number(expiry) * 1000).toLocaleDateString("en", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	// (tx.from) sender_address, (tx.to) controller_address, owner_address

	return (
		<Description success={props.event.success}>
			<Action type="register">Register</Action>
			<span>{props.event.name}.eth</span>
			<span>expiring</span>
			<span>{expiryFormatted}</span>
		</Description>
	);
}
