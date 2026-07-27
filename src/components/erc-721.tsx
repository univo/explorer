import { Img } from "./img";
import { getClient } from "@/clients";
import { AddViewButton } from "./views";
import { Hoverable } from "./hoverable";
import type { Chain } from "@/constants";
import { getErc721 } from "@/state/account";
import { Description } from "./description";

export async function Erc721(props: { chain: Chain; address: `0x${string}`; id: `0x${string}` }) {
	const [account, src] = await Promise.all([
		getErc721({ chain: props.chain, address: props.address }), //
		getErc721TokenURI({ chain: props.chain, address: props.address, id: props.id }),
	]);

	return (
		<AddViewButton view={props.address} className="select-none touch-none cursor-pointer">
			<Hoverable id={`${props.chain}:${props.address}`}>
				<Description>
					<Image src={src} />
					<span>{account["erc721.name"]}</span>
					<span className="text-gray-500 select-all">({account["erc721.symbol"]})</span>
					<span>#{BigInt(props.id)}</span>
				</Description>
			</Hoverable>
		</AddViewButton>
	);
}

async function getErc721TokenURI(opts: { chain: Chain; address: `0x${string}`; id: `0x${string}` }) {
	try {
		const uri = await getClient(opts.chain).readContract({
			address: opts.address,
			args: [BigInt(opts.id)],
			functionName: "tokenURI",
			abi: [
				{
					type: "function",
					name: "tokenURI",
					stateMutability: "view",
					outputs: [{ name: "", type: "string" }],
					inputs: [{ name: "tokenId", type: "uint256" }],
				},
			],
		});

		return uri;
	} catch (error) {
		return null;
	}
}

function Image(props: { src: string | null }) {
	return (
		<div className="overflow-hidden rounded-md size-4 bg-gray-300">
			<Img src={props.src} fallback="/img/fallback.svg" />
		</div>
	);
}
