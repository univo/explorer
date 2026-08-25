import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import { Description } from "@/components/description";
import type { LogEnsNameForAddrChangedV1 } from "./event";

export function LogEnsNameForAddrChangedV1Description(props: { event: LogEnsNameForAddrChangedV1 }) {
	const chain = parseId(props.event.id).chainId;
	const isRevoked = props.event.name === "";

	if (isRevoked) {
		return (
			<Description>
				<Account chain={chain} address={props.event.account_address} />
				<Action type="revoked">cleared</Action>
				<span>their primary ENS name</span>
			</Description>
		);
	}
	return (
		<Description>
			<Account chain={chain} address={props.event.account_address} />
			<Action type="registered">set</Action>
			<span>their primary ENS name to</span>
			<span>{props.event.name}</span>
		</Description>
	);
}
