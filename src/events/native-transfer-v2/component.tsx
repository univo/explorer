import { isAddressEqual } from "viem";

import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { NativeTransferV2 } from "./event";
import { Hoverable } from "@/components/hoverable";
import { ExclamationIcon } from "@/components/icons";
import { formatTokenAmount, parseId } from "@/helpers";
import { Description } from "@/components/description";
import type { Account as IAccount } from "@/state/account";

export function NativeTransferV2Description(props: { event: NativeTransferV2 }) {
	const chain = parseId(props.event.id).chain_id;

	return (
		<Description>
			{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
			<Account chain={chain} address={props.event.from_address} />
			<Action type="sent">sent</Action>
			<span>{formatTokenAmount(props.event.quantity, 18)}</span>
			<Hoverable id={"10xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"}>
				<Description>
					<div className="rounded-full overflow-hidden size-4">
						<img alt="" src="https://etherscan.io/token/images/ether.png" />
					</div>
					<span>Ether</span>
					<span className="text-gray-500 select-all">(ETH)</span>
				</Description>
			</Hoverable>
			<span>to</span>
			<Account chain={chain} address={props.event.to_address} />
		</Description>
	);
}

export function NativeTransferV2AccountDescription(props: { event: NativeTransferV2; account: IAccount }) {
	const chain = parseId(props.event.id).chain_id;

	if (isAddressEqual(props.account.address, props.event.from_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="sent">Sent</Action>
				<span>{formatTokenAmount(props.event.quantity, 18)}</span>
				<Hoverable id={"10xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"}>
					<Description>
						<div className="rounded-full overflow-hidden size-4">
							<img alt="" src="https://etherscan.io/token/images/ether.png" />
						</div>
						<span>Ether</span>
						<span className="text-gray-500 select-all">(ETH)</span>
					</Description>
				</Hoverable>
				<span>to</span>
				<Account chain={chain} address={props.event.to_address} />
			</Description>
		);
	}

	if (isAddressEqual(props.account.address, props.event.to_address)) {
		return (
			<Description>
				{props.event.success === false && <ExclamationIcon className="size-4 text-red-500" />}
				<Action type="received">Received</Action>
				<span>{formatTokenAmount(props.event.quantity, 18)}</span>
				<Hoverable id={"10xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"}>
					<Description>
						<div className="rounded-full overflow-hidden size-4">
							<img alt="" src="https://etherscan.io/token/images/ether.png" />
						</div>
						<span>Ether</span>
						<span className="text-gray-500 select-all">(ETH)</span>
					</Description>
				</Hoverable>
				<span>from</span>
				<Account chain={chain} address={props.event.from_address} />
			</Description>
		);
	}

	return <NativeTransferV2Description event={props.event} />;
}
