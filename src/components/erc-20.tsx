import { Fragment } from "react";
import { isAddressEqual } from "viem";

import { Img } from "./img";
import { Account } from "./account";
import { Hoverable } from "./hoverable";
import { AddViewButton } from "./views";
import type { Chain } from "@/constants";
import { getToken } from "@/state/token";
import { Description } from "./description";
import { formatTokenAmount } from "@/helpers";

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

	const token = await getToken({ chain: props.chain, address: props.address });

	if (token.name && token.symbol) {
		return (
			<Fragment>
				<Quantity quantity={props.quantity} decimals={token.decimals} />

				<AddViewButton view={props.address} className="select-none cursor-pointer touch-none">
					<Hoverable id={`${props.chain}:${props.address}`}>
						<Description>
							<Image src={token.image} />
							<span>{token.name}</span>
							<span className="text-gray-500 select-all">({token.symbol})</span>
						</Description>
					</Hoverable>
				</AddViewButton>
			</Fragment>
		);
	}

	// Unfortunately this creates a waterfall.

	return <Account chain={props.chain} address={props.address} />;
}

function Quantity(props: { decimals: number | null; quantity: `0x${string}` | bigint | undefined }) {
	if (!props.quantity) {
		return null;
	}

	if (!props.decimals) {
		return null;
	}

	return <span>{formatTokenAmount(props.quantity, props.decimals)}</span>;
}

function Image(props: { src: string | null }) {
	if (props.src === null) {
		return null;
	}

	return (
		<div className="rounded-full overflow-hidden size-4">
			<Img src={props.src} />
		</div>
	);
}
