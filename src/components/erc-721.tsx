import { AddViewButton } from "./views";
import { Hoverable } from "./hoverable";
import type { Chain } from "@/constants";
import { getErc721 } from "@/state/account";
import { Description } from "./description";

// TODO: Also look up the tokenUri in parallel

export async function Erc721(props: { chain: Chain; address: `0x${string}`; id: `0x${string}` }) {
	const account = await getErc721({ chain: props.chain, address: props.address });

	return (
		<AddViewButton view={props.address} className="select-none touch-none cursor-pointer">
			<Hoverable id={`${props.chain}:${props.address}`}>
				<Description>
					<span>{account["erc721.name"]}</span>
					<span className="text-gray-500 select-all">({account["erc721.symbol"]})</span>
					<span>#{BigInt(props.id)}</span>
				</Description>
			</Hoverable>
		</AddViewButton>
	);
}
