import { isAddressEqual } from "viem";

import { Action } from "@/components/action";
import { Account } from "@/components/account";
import type { NativeTransferV3 } from "./event";
import { Hoverable } from "@/components/hoverable";
import { ExclamationIcon } from "@/components/icons";
import { formatTokenAmount, parseId } from "@/helpers";
import { Description } from "@/components/description";
import type { Account as IAccount } from "@/state/account";

export function NativeTransferV3Description(props: { event: NativeTransferV3 }) {
	const chain = parseId(props.event.id).chainId;

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

export function NativeTransferV3AccountDescription(props: { event: NativeTransferV3; account: IAccount }) {
	const chain = parseId(props.event.id).chainId;

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

	return <NativeTransferV3Description event={props.event} />;
}
