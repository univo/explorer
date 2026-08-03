import { parseId } from "@/helpers";
import { ETH_ADDRESS } from "@/constants";
import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { EnsNameRegisteredV3 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";

export function EnsNameRegisteredV3Description(props: { event: EnsNameRegisteredV3 }) {
	const chain = parseId(props.event.id).chainId;

	const expiring = new Date(Number(BigInt(props.event.expires_at)) * 1000).toLocaleDateString("en", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.owner_address} />
			<Action type="registered">registered</Action>
			<span>{props.event.name}.eth</span>
			<span>for</span>
			<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.cost_eth} />
			<span>expiring</span>
			<span>{expiring}</span>
		</Description>
	);
}

export function EnsNameRegisteredV3AccountDescription(props: { event: EnsNameRegisteredV3; address: `0x${string}` }) {
	const chain = parseId(props.event.id).chainId;

	const expiring = new Date(Number(BigInt(props.event.expires_at)) * 1000).toLocaleDateString("en", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Action type="registered">Registered</Action>
			<span>{props.event.name}.eth</span>
			<span>for</span>
			<Erc20 chain={chain} address={ETH_ADDRESS} quantity={props.event.cost_eth} />
			<span>expiring</span>
			<span>{expiring}</span>
		</Description>
	);
}
