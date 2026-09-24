import { isAddressEqual } from "viem";

import { Erc20 } from "@/components/erc-20";
import { Action } from "@/components/action";
import { getExternalChain } from "@/helpers";
import { Account } from "@/components/account";
import type { LogErc20TransferV2 } from "./event";
import { Description } from "@/components/description";

export function LogErc20TransferV2Description(props: { event: LogErc20TransferV2; address: `0x${string}` | undefined }) {
	const chain = getExternalChain(props.event.chain);
	const blockTimestamp = props.event.block_timestamp.getTime() / 1000;

	if (isAddressEqual(props.event.from_address, "0x0000000000000000000000000000000000000000")) {
		return (
			<Description>
				<Account chain={chain} address={props.event.to_address} />
				<Action type="mint">minted</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
			</Description>
		);
	}

	if (isAddressEqual(props.event.to_address, "0x0000000000000000000000000000000000000000")) {
		return (
			<Description>
				<Account chain={chain} address={props.event.from_address} />
				<Action type="burn">burnt</Action>
				<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
			</Description>
		);
	}

	return (
		<Description>
			<Account chain={chain} address={props.event.from_address} />
			<Action type="send">sent</Action>
			<Erc20 chain={chain} address={props.event.token_address} quantity={props.event.quantity} at={blockTimestamp} />
			<span>to</span>
			<Account chain={chain} address={props.event.to_address} />
		</Description>
	);
}
