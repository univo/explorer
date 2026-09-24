import { isHexEqual } from "@/utils";
import { ZERO_ADDRESS } from "@/constants";
import { Action } from "@/components/action";
import { getExternalChain } from "@/helpers";
import { Account } from "@/components/account";
import type { LogEnsNewOwnerV2 } from "./event";
import { Description } from "@/components/description";

export function LogEnsNewOwnerV2Description(props: { event: LogEnsNewOwnerV2; address: `0x${string}` | undefined }) {
	const chain = getExternalChain(props.event.chain);
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
