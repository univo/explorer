import { getAddress } from "viem";

import { Img } from "./img";
import { Account } from "./account";
import { getClient } from "@/clients";
import { AddViewButton } from "./views";
import { Hoverable } from "./hoverable";
import type { Chain } from "@/constants";
import { defined, logger } from "@/utils";
import { Description } from "./description";
import { getErc721Account } from "@/state/account";

export async function Erc721(props: { chain: Chain; address: `0x${string}`; id: `0x${string}` }) {
	const address = getAddress(props.address);

	const [account, metadata] = await Promise.all([
		getErc721Account({ chain: props.chain, address }), //
		getErc721Metadata({ chain: props.chain, address, id: props.id }),
	]);

	if (account === null) {
		return <Account chain={props.chain} address={address} />;
	}

	return (
		<AddViewButton view={address} className="select-none touch-none cursor-pointer">
			<Hoverable id={`${props.chain}:${address}:${props.id}`}>
				<Description>
					{defined(metadata) && <Image src={metadata.image} />}
					<span>{account["erc721.name"]}</span>
					<span className="text-gray-500 select-all">({account["erc721.symbol"]})</span>
					<span className="truncate max-w-18 lg:max-w-24">#{BigInt(props.id)}</span>
				</Description>
			</Hoverable>
		</AddViewButton>
	);
}

// Based on this metadata standard: https://docs.opensea.io/docs/metadata-standards

type Metadata = {
	name: string;
	image: string;
	description: string;
	external_url: string;
};

async function getErc721Metadata(opts: { chain: Chain; address: `0x${string}`; id: `0x${string}` }) {
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

		// TODO
		// Probably makes sense to perform this `fetch` on the client. This would allow us to show UI faster
		// and let the browser handle caching. The only issue preventing this is CORS. Eventually we should
		// implement image transformations with our own endpoint so CORS won't be an issue

		const res = await fetch(uri);

		if (!res.ok || res.status < 200 || res.status >= 300) {
			throw new Error(res.statusText);
		}

		const json = await res.json();

		return json as Metadata;
	} catch (error) {
		if (error instanceof Error) {
			logger.error(`Failed to get erc721 metadata: ${error.message}`);
		}

		return undefined;
	}
}

function Image(props: { src: string | undefined }) {
	return (
		<div className="overflow-hidden rounded-md size-4 bg-gray-300">
			<Img src={props.src} fallback="/img/fallback.svg" />
		</div>
	);
}
