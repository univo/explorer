import { parseId } from "@/helpers";
import { ZERO_ADDRESS } from "@/constants";
import { Action } from "@/components/action";
import { Erc721 } from "@/components/erc-721";
import { Account } from "@/components/account";
import { isHexEqual, unreachable } from "@/utils";
import type { IntentErc721ApprovalV1 } from "./event";
import { Description } from "@/components/description";

export function IntentErc721ApprovalV1AccountDescription(props: { event: IntentErc721ApprovalV1; address: `0x${string}` }) {
	const chain = parseId(props.event.id).chainId;
	const revoked = isHexEqual(props.event.spender_address, ZERO_ADDRESS);

	// Note that for all the `revoked` code paths the spender is the null address

	// (tx.from) caller_address

	if (isHexEqual(props.address, props.event.caller_address)) {
		if (revoked) {
			return (
				<Description success={props.event.success}>
					<Action type="revoked">Revoke</Action>
					<span>approval to transfer</span>
					<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Action type="approved">Approve</Action>
				<Account chain={chain} address={props.event.spender_address} />
				<span>to transfer</span>
				<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
			</Description>
		);
	}

	// (tx.to) token_address

	if (isHexEqual(props.address, props.event.token_address)) {
		if (revoked) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.caller_address} />
					<Action type="revoked">revokes</Action>
					<span>approval to transfer</span>
					<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.caller_address} />
				<Action type="approved">approves</Action>
				<Account chain={chain} address={props.event.spender_address} />
				<span>to transfer</span>
				<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
			</Description>
		);
	}

	// spender_address

	if (isHexEqual(props.address, props.event.spender_address)) {
		if (revoked) {
			return (
				<Description success={props.event.success}>
					<Account chain={chain} address={props.event.caller_address} />
					<Action type="revoked">revokes</Action>
					<span>approval to transfer</span>
					<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
				</Description>
			);
		}

		return (
			<Description success={props.event.success}>
				<Account chain={chain} address={props.event.caller_address} />
				<Action type="approved">approves</Action>
				<span>this account to transfer</span>
				<Erc721 chain={chain} address={props.event.token_address} id={props.event.token_id} />
			</Description>
		);
	}

	unreachable();
}
