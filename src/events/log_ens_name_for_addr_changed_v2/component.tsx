import { Action } from "@/components/action";
import { getExternalChain } from "@/helpers";
import { Account } from "@/components/account";
import { Description } from "@/components/description";
import type { LogEnsNameForAddrChangedV2 } from "./event";

export function LogEnsNameForAddrChangedV2Description(props: { event: LogEnsNameForAddrChangedV2; address: `0x${string}` | undefined }) {
	const chain = getExternalChain(props.event.chain);
	const isRevoked = props.event.name === "";

	if (isRevoked) {
		return (
			<Description>
				<Account chain={chain} address={props.event.account_address} />
				<Action type="revoke">cleared</Action>
				<span>their primary ENS name</span>
			</Description>
		);
	}

	return (
		<Description>
			<Account chain={chain} address={props.event.account_address} />
			<Action type="register">set</Action>
			<span>their primary ENS name to</span>
			<span>{props.event.name}</span>
		</Description>
	);
}
