import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { LogEnsReverseClaimedV1 } from "./event";
import { Description } from "@/components/description";

export function LogEnsReverseClaimedV1Description(props: { event: LogEnsReverseClaimedV1 }) {
	const chain = parseId(props.event.id).chainId;

	return (
		<Description>
			<Account chain={chain} address={props.event.account_address} />
			<Action type="registered">claimed</Action>
			<span>an ENS reverse record</span>
		</Description>
	);
}

export function LogEnsReverseClaimedV1AccountDescription(props: { event: LogEnsReverseClaimedV1; address: `0x${string}` }) {
	return <LogEnsReverseClaimedV1Description event={props.event} />;
}
