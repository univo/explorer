import { Fragment } from "react";
import { isAddressEqual } from "viem";

import { Img } from "./img";
import { Account } from "./account";
import { Hoverable } from "./hoverable";
import { AddViewButton } from "./views";
import type { Chain } from "@/constants";
import { Description } from "./description";
import { formatTokenAmount } from "@/helpers";
import { getErc20Account } from "@/state/account";

export async function Erc20(props: { chain: Chain; address: `0x${string}`; quantity?: `0x${string}` | bigint }) {
	if (props.chain === 1 && isAddressEqual(props.address, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")) {
		return (
			<Fragment>
				<Quantity quantity={props.quantity} decimals={18} />

				<Hoverable id={`${props.chain}:${props.address}`}>
					<Description>
						<Image src="https://etherscan.io/token/images/ether.png" />
						<span>Ether</span>
						<span className="text-gray-500 select-all">(ETH)</span>
					</Description>
				</Hoverable>
			</Fragment>
		);
	}

	const account = await getErc20Account({ chain: props.chain, address: props.address });

	if (account === null) {
		return <Account chain={props.chain} address={props.address} />;
	}

	return (
		<Fragment>
			<Quantity quantity={props.quantity} decimals={account["erc20.decimals"]} />

			<AddViewButton view={props.address} className="select-none cursor-pointer touch-none">
				<Hoverable id={`${props.chain}:${props.address}`}>
					<Description>
						<Image src={account["erc20.image"]} />
						<span>{account["erc20.name"]}</span>
						<span className="text-gray-500 select-all">({account["erc20.symbol"]})</span>
					</Description>
				</Hoverable>
			</AddViewButton>
		</Fragment>
	);
}

function Quantity(props: { decimals: number; quantity: `0x${string}` | bigint | undefined }) {
	if (props.quantity === undefined) {
		return null;
	}

	return <span>{formatTokenAmount(props.quantity, props.decimals)}</span>;
}

function Image(props: { src: string | undefined }) {
	if (props.src === undefined) {
		return null;
	}

	return (
		<div className="rounded-full overflow-hidden size-4">
			<Img src={props.src} fallback="/img/fallback.svg" />
		</div>
	);
}
