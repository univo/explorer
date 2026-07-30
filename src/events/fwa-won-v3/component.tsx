import { parseId } from "@/helpers";
import { unreachable } from "@/utils";
import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { FwaWonV3 } from "./event";
import { ExclamationIcon } from "@/components/icons";
import { Description } from "@/components/description";
import type { Account as IAccount } from "@/state/account";

// const FWA_TOKEN_ADDRESS = "0xa0Df17B5aC76ABaBA36E1450E2cbCd18A620C845";

export function FwaWonV3Description(props: { event: FwaWonV3 }) {
	const chain = parseId(props.event.id).chainId;

	if (props.event.settlement_type === "kept") {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.purchaser_address} />
				<Action type="won">settled</Action>
				<span>FWA position #{BigInt(props.event.listing_id).toString()}</span>
			</Description>
		);
	}

	if (props.event.settlement_type === "relisted") {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.purchaser_address} />
				<Action type="won">settled</Action>
				<span>FWA position #{BigInt(props.event.listing_id).toString()}</span>
			</Description>
		);
	}

	if (props.event.settlement_type === "accepted_eth") {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.purchaser_address} />
				<Action type="won">settled</Action>
				<span>FWA position #{BigInt(props.event.listing_id).toString()}</span>
			</Description>
		);
	}

	if (props.event.settlement_type === "accepted_fwa") {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Account chain={chain} address={props.event.purchaser_address} />
				<Action type="won">settled</Action>
				<span>FWA position #{BigInt(props.event.listing_id).toString()}</span>
			</Description>
		);
	}

	unreachable();
}

export function FwaWonV3AccountDescription(props: { event: FwaWonV3; account: IAccount }) {
	return <FwaWonV3Description event={props.event} />;
}
