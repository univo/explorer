import { zeroAddress } from "viem";

import { parseId } from "@/helpers";
import { Action } from "@/components/action";
import { Erc721 } from "@/components/erc-721";
import { Account } from "@/components/account";
import { isHexEqual, unreachable } from "@/utils";
import type { IntentErc721TransferV1 } from "./event";
import { Description } from "@/components/description";

export function IntentErc721TransferV1AccountDescription(props: { event: IntentErc721TransferV1; address: `0x${string}` }) {
	const chain = parseId(props.event.id).chainId;

	// (tx.from) caller_address: the account that initiated the transfer

	if (isHexEqual(props.address, props.event.caller_address)) {
		// Caller is the owner

		if (isHexEqual(props.event.caller_address, props.event.from_address)) {
			// Owner is burning the NFT if sending it to the null address

			if (isHexEqual(props.event.to_address, zeroAddress)) {
				return (
					<Description success={props.event.success}>
						<Action type="burn">Burn</Action>
						<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
					</Description>
				);
			}

			return (
				<Description success={props.event.success}>
					<Action type="send">Send</Action>
					<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
					<span>to</span>
					<Account chain={chain} address={props.event.to_address} />
				</Description>
			);
		}

		// Caller is not the owner but initiated the transfer

		if (isHexEqual(props.event.to_address, zeroAddress)) {
			return (
				<Description success={props.event.success}>
					<Action type="burn">Burn</Action>
					<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
					<span>owned by</span>
					<Account chain={chain} address={props.event.from_address} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Action type="send">Transfer</Action>
				<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
				<span>from</span>
				<Account chain={chain} address={props.event.from_address} />
				<span>to</span>
				<Account chain={chain} address={props.event.to_address} />
			</Description>
		);
	}

	// from_address: the account losing ownership of the NFT. Also did not initiate the transfer, this
	// usually happens if we have delegated approval to some contract.

	if (isHexEqual(props.address, props.event.from_address)) {
		// We are burning the NFT if sending it to the null address

		if (isHexEqual(props.event.to_address, zeroAddress)) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.caller_address} />
					<Action type="burn">burns</Action>
					<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.caller_address} />
				<Action type="send">sends</Action>
				<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
				<span>to</span>
				<Account chain={chain} address={props.event.to_address} />
			</Description>
		);
	}

	// to_address: the account gaining ownership of the NFT. Also did not initiate the transfer

	if (isHexEqual(props.address, props.event.to_address)) {
		// When minting a fresh NFT it received from the null address

		if (isHexEqual(props.event.from_address, zeroAddress)) {
			return (
				<Description success={props.event.success}>
					<Action type="receive">Receive</Action>
					<span>freshly minted</span>
					<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Action type="receive">Receive</Action>
				<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
				<span>from</span>
				<Account chain={chain} address={props.event.from_address} />
			</Description>
		);
	}

	// (tx.to) token_address: the NFT contract interacted with

	if (isHexEqual(props.address, props.event.token_address)) {
		// Caller is the owner

		if (isHexEqual(props.event.caller_address, props.event.from_address)) {
			// Owner is burning the NFT is sending to the null address

			if (isHexEqual(props.event.to_address, zeroAddress)) {
				return (
					<Description success={props.event.success}>
						<Account chain={chain} address={props.event.from_address} />
						<Action type="burn">burns</Action>
						<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
					</Description>
				);
			}

			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.from_address} />
					<Action type="send">sends</Action>
					<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
					<span>to</span>
					<Account chain={chain} address={props.event.to_address} />
				</Description>
			);
		}

		// Caller is not the owner but initiated the transfer

		if (isHexEqual(props.event.to_address, zeroAddress)) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.caller_address} />
					<Action type="burn">burns</Action>
					<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
					<span>owned by</span>
					<Account chain={chain} address={props.event.from_address} />
				</Description>
			);
		}

		if (isHexEqual(props.event.from_address, zeroAddress)) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.caller_address} />
					<Action type="mint">mints</Action>
					<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
					<span>to</span>
					<Account chain={chain} address={props.event.to_address} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.caller_address} />
				<Action type="send">transfers</Action>
				<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
				<span>from</span>
				<Account chain={chain} address={props.event.from_address} />
				<span>to</span>
				<Account chain={chain} address={props.event.to_address} />
			</Description>
		);
	}

	unreachable();
}
