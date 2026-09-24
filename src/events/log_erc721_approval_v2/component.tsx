import { Action } from "@/components/action";
import { Erc721 } from "@/components/erc-721";
import { getExternalChain } from "@/helpers";
import { Account } from "@/components/account";
import type { LogErc721ApprovalV2 } from "./event";
import { Description } from "@/components/description";

export function LogErc721ApprovalV2Description(props: { event: LogErc721ApprovalV2; address: `0x${string}` | undefined }) {
	const chain = getExternalChain(props.event.chain);
	const revoked = props.event.spender_address === "0x0000000000000000000000000000000000000000";

	if (revoked) {
		return (
			<Description>
				<Account chain={chain} address={props.event.owner_address} />
				<Action type="revoke">revoked</Action>
				<span>approval for</span>
				<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
				<span>to be transferred</span>
			</Description>
		);
	}

	return (
		<Description>
			<Account chain={chain} address={props.event.owner_address} />
			<Action type="approve">approved</Action>
			<Account chain={chain} address={props.event.spender_address} />
			<span>to transfer</span>
			<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
		</Description>
	);
}
