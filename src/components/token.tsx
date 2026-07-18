import { Fragment } from "react";

import { Account } from "./account";
import { Hoverable } from "./hoverable";
import { AddViewButton } from "./views";
import { getToken } from "@/state/token";
import { Description } from "./description";
import { formatTokenAmount } from "@/helpers";

export async function Token(props: { chain: number; address: `0x${string}`; quantity?: `0x${string}` }) {
	const token = await getToken({ chain: props.chain, address: props.address });

	if (token.name && token.symbol) {
		return (
			<Fragment>
				<TokenQuantity decimals={token.decimals} quantity={props.quantity} />

				<AddViewButton view={props.address} className="select-none cursor-pointer touch-none">
					<Hoverable id={props.chain + props.address}>
						<Description>
							<TokenImage image={token.image} />
							<span>{token.name}</span>
							<span className="text-gray-500">({token.symbol})</span>
						</Description>
					</Hoverable>
				</AddViewButton>
			</Fragment>
		);
	}

	// Unfortunately this creates a waterfall.

	return <Account chain={props.chain} address={props.address} />;
}

function TokenQuantity(props: { decimals: number | null; quantity: `0x${string}` | undefined }) {
	if (!props.quantity) {
		return null;
	}

	if (!props.decimals) {
		return null;
	}

	return <span>{formatTokenAmount(props.quantity, props.decimals)}</span>;
}

function TokenImage(props: { image: string | null }) {
	if (props.image === null) {
		return null;
	}

	return (
		<div className="rounded-full overflow-hidden size-4">
			<img alt="" src={props.image} />
		</div>
	);
}
