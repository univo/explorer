import { isAddressEqual, zeroAddress } from "viem";

import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { LogEnsNewOwnerV1 } from "./event";
import { Description } from "@/components/description";

export function LogEnsNewOwnerV1Description(props: { event: LogEnsNewOwnerV1 }) {
	const chain = parseId(props.event.id).chainId;
	const revoked = isAddressEqual(props.event.owner_address, zeroAddress);

	if (revoked) {
		return (
			<Description>
				<Action type="revoked">Revoked</Action>
				<span>ownership of an ENS reverse record</span>
			</Description>
		);
	}

	return (
		<Description>
			<Account chain={chain} address={props.event.owner_address} />
			<Action type="received">received</Action>
			<span>ownership of an ENS reverse record</span>
		</Description>
	);
}
