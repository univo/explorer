import { parseId } from "@/helpers";
import { isHexEqual } from "@/utils";
import { ZERO_ADDRESS } from "@/constants";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { LogEnsNewOwnerV1 } from "./event";
import { Description } from "@/components/description";

export function LogEnsNewOwnerV1Description(props: { event: LogEnsNewOwnerV1 }) {
	const chain = parseId(props.event.id).chainId;
	const revoked = isHexEqual(props.event.owner_address, ZERO_ADDRESS);

	if (revoked) {
		return (
			<Description>
				<Action type="revoke">Revoked</Action>
				<span>ownership of an ENS reverse record</span>
			</Description>
		);
	}

	return (
		<Description>
			<Account chain={chain} address={props.event.owner_address} />
			<Action type="receive">received</Action>
			<span>ownership of an ENS reverse record</span>
		</Description>
	);
}
