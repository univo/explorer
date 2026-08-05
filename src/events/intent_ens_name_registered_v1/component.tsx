import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import type { IntentEnsNameRegisteredV1 } from "./event";

export function IntentEnsNameRegisteredV1Description(props: { event: IntentEnsNameRegisteredV1 }) {
	const { chainId, blockTimestamp } = parseId(props.event.id);

	const expiry = BigInt(blockTimestamp) + BigInt(props.event.duration);

	const expiryFormatted = new Date(Number(expiry) * 1000).toLocaleDateString("en", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chainId} address={props.event.owner_address} />
			<Action type="registered">registered</Action>
			<span>{props.event.name}.eth</span>
			<span>expiring</span>
			<span>{expiryFormatted}</span>
		</Description>
	);
}

export function IntentEnsNameRegisteredV1AccountDescription(props: {
	event: IntentEnsNameRegisteredV1;
	address: `0x${string}`;
}) {
	const { blockTimestamp } = parseId(props.event.id);

	const expiry = BigInt(blockTimestamp) + BigInt(props.event.duration);

	const expiryFormatted = new Date(Number(expiry) * 1000).toLocaleDateString("en", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Action type="registered">Registered</Action>
			<span>{props.event.name}.eth</span>
			<span>expiring</span>
			<span>{expiryFormatted}</span>
		</Description>
	);
}
