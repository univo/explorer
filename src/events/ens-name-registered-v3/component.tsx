import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { Hoverable } from "@/components/hoverable";
import type { EnsNameRegisteredV3 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import { formatTokenAmount, parseId } from "@/helpers";
import type { Account as IAccount } from "@/state/account";

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
			<span>{formatTokenAmount(BigInt(props.event.cost_eth).toString(), 18)}</span>
			<Hoverable id={"10xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"}>
				<Description>
					<span>Ether</span>
					<span className="text-gray-500 select-all">(ETH)</span>
				</Description>
			</Hoverable>
			<span>expiring</span>
			<span>{expiring}</span>
		</Description>
	);
}

export function EnsNameRegisteredV3AccountDescription(props: { event: EnsNameRegisteredV3; account: IAccount }) {
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
			<span>{formatTokenAmount(BigInt(props.event.cost_eth).toString(), 18)}</span>
			<Hoverable id={"10xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"}>
				<Description>
					<span>Ether</span>
					<span className="text-gray-500 select-all">(ETH)</span>
				</Description>
			</Hoverable>
			<span>expiring</span>
			<span>{expiring}</span>
		</Description>
	);
}
