import { isAddressEqual } from "viem";

import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Erc721 } from "@/components/erc-721";
import { Account } from "@/components/account";
import type { IntentErc721TransferV1 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";

export function IntentErc721TransferV1Description(props: { event: IntentErc721TransferV1 }) {
	const chain = parseId(props.event.id).chainId;

	if (isAddressEqual(props.event.from_address, "0x0000000000000000000000000000000000000000")) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.to_address} />
				<Action type="minted">minted</Action>
				<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
			</Description>
		);
	}

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.from_address} />
			<Action type="sent">sent</Action>
			<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
			<span>to</span>
			<Account chain={chain} address={props.event.to_address} />
		</Description>
	);
}

export function IntentErc721TransferV1AccountDescription(props: {
	event: IntentErc721TransferV1;
	address: `0x${string}`;
}) {
	const chain = parseId(props.event.id).chainId;

	if (isAddressEqual(props.address, props.event.from_address)) {
		if (isAddressEqual(props.event.to_address, "0x0000000000000000000000000000000000000000")) {
			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Action type="burnt">Burnt</Action>
					<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
				</Description>
			);
		}

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="sent">Sent</Action>
				<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
				<span>to</span>
				<Account chain={chain} address={props.event.to_address} />
			</Description>
		);
	}

	if (isAddressEqual(props.address, props.event.to_address)) {
		if (isAddressEqual(props.event.from_address, "0x0000000000000000000000000000000000000000")) {
			return (
				<Description>
					{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
					<Action type="received">Received</Action>
					<span>freshly minted</span>
					<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
				</Description>
			);
		}

		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="received">Received</Action>
				<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
				<span>from</span>
				<Account chain={chain} address={props.event.from_address} />
			</Description>
		);
	}

	return <IntentErc721TransferV1Description event={props.event} />;
}
