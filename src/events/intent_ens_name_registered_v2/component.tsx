import { isHexEqual } from "@/utils";
import { Action } from "@/components/action";
import { getExternalChain } from "@/helpers";
import { Account } from "@/components/account";
import { Description } from "@/components/description";
import type { IntentEnsNameRegisteredV2 } from "./event";

export function IntentEnsNameRegisteredV2AccountDescription(props: {
	event: IntentEnsNameRegisteredV2;
	address: `0x${string}` | undefined;
}) {
	const chain = getExternalChain(props.event.chain);
	const blockTimestamp = props.event.block_timestamp.getTime() / 1000;
	const expiry = BigInt(blockTimestamp) + BigInt(props.event.duration);

	const expiryFormatted = new Date(Number(expiry) * 1000).toLocaleDateString("en", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	// owner_address

	if (isHexEqual(props.address, props.event.owner_address)) {
		return (
			<Description success={props.event.success}>
				<Action type="register">Register</Action>
				<span>{props.event.name}.eth</span>
				<span>expiring</span>
				<span>{expiryFormatted}</span>
			</Description>
		);
	}

	// (tx.from) sender_address, (tx.to) controller_address

	return (
		<Description success={props.event.success}>
			{props.address === undefined && <Account chain={chain} address={props.event.owner_address} />}
			<Action type="register">registers</Action>
			<span>{props.event.name}.eth</span>
			<span>expiring</span>
			<span>{expiryFormatted}</span>
		</Description>
	);
}
