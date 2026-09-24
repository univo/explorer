import { isAddressEqual } from "viem";

import { Action } from "@/components/action";
import { Erc721 } from "@/components/erc-721";
import { getExternalChain } from "@/helpers";
import { Account } from "@/components/account";
import type { LogErc721TransferV2 } from "./event";
import { Description } from "@/components/description";

export function LogErc721TransferV2Description(props: { event: LogErc721TransferV2; address: `0x${string}` | undefined }) {
	const chain = getExternalChain(props.event.chain);

	if (isAddressEqual(props.event.from_address, "0x0000000000000000000000000000000000000000")) {
		return (
			<Description>
				<Account chain={chain} address={props.event.to_address} />
				<Action type="mint">minted</Action>
				<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
			</Description>
		);
	}

	return (
		<Description>
			<Account chain={chain} address={props.event.from_address} />
			<Action type="send">sent</Action>
			<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
			<span>to</span>
			<Account chain={chain} address={props.event.to_address} />
		</Description>
	);
}
