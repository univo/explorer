import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { LogEnsReverseClaimedV1 } from "./event";
import { Description } from "@/components/description";

// This component doesn't provide much information. Unfortunately the `node` value in the event
// is the hash of the ENS name. ENS recognised this was bad design and implemented a new
// NameChangedForAddr event that doesn't perform this hashing. To solve this, we could store more
// data that would allow us to perform a JOIN here and get back to the original ENS name but
// I've decided it's not really worth it for a legacy event

export function LogEnsReverseClaimedV1Description(props: { event: LogEnsReverseClaimedV1 }) {
	const chain = parseId(props.event.id).chainId;

	return (
		<Description>
			<Account chain={chain} address={props.event.account_address} />
			<Action type="register">claimed</Action>
			<span>an ENS reverse record</span>
		</Description>
	);
}
