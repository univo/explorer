import clsx from "clsx";
import { useState } from "react";
import { getAddress } from "viem";
import { Command, useCommandState } from "cmdk";

import { getFrame, useFrames } from "./frames";
import { SearchIcon, XIcon } from "./icons";

// TODO
// Probably need to add a dropdown for the supported chains, this makes it explictly clear when pasting
// an address or block number which chain is actually intended for the search

interface SearchProps {
	onClose?: () => void;
}

export function Search(props: SearchProps) {
	const frames = useFrames();
	const [search, setSearch] = useState("");

	async function onPaste() {
		const search = await navigator.clipboard.readText();

		const frame = getFrame(search); // Determine if search satisfies a known frame

		if (!frame) {
			return;
		}

		if (props.onClose) {
			props.onClose();
		}

		frames.push(frame.raw, null);
	}

	return (
		<Command className="bg-white shadow-xl w-full rounded-none sm:rounded-lg ring-1 ring-black/5 outline-hidden overflow-hidden">
			<div className="flex flex-col flex-1 min-h-screen md:min-h-0 divide-y divide-gray-100">
				<div className="relative flex items-center">
					<SearchIcon className="shrink-0 absolute text-gray-500 size-4 start-4" />

					<Command.Input
						value={search}
						onPaste={onPaste}
						onValueChange={setSearch}
						placeholder="Search tokens, transactions, accounts..."
						className="w-full placeholder-gray-500 bg-transparent border-0 text-gray-900 focus:ring-0 focus:outline-hidden text-sm h-11 md:h-12 px-4 ps-11 pe-10"
					/>

					{!!props.onClose && (
						<button
							type="button"
							onClick={props.onClose}
							className={clsx(
								"cursor-pointer inline-flex items-center absolute end-2.5 rounded-md shrink-0 p-1.5 text-gray-400",
								"focus:outline-hidden focus-visible:outline-0",
								"focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-primary-500",
								"disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:cursor-not-allowed aria-disabled:opacity-75",
								"hover:text-gray-500 hover:bg-gray-100",
							)}
						>
							<XIcon className="shrink-0 size-4" />
						</button>
					)}
				</div>

				<Command.List className="outline-hidden overflow-y-auto grow sm:h-[398px]">
					<EmptyState />
					<Tokens onClose={props.onClose} />
				</Command.List>
			</div>
		</Command>
	);
}

function EmptyState() {
	const search = useCommandState((state) => state.search);

	if (search === "") {
		return null;
	}

	if (isTxHash(search)) {
		return null;
	}

	if (isAccount(search)) {
		return null;
	}

	return (
		<Command.Empty className="p-8">
			<p className="text-sm text-center text-gray-900">No results found. Please try again.</p>
		</Command.Empty>
	);
}

function isAccount(search: string) {
	return search.length === 42 && search.startsWith("0x");
}

function isTxHash(search: string) {
	return search.length === 66 && search.startsWith("0x");
}

const tokens = [
	{
		chain: 1,
		name: "USDC",
		symbol: "USDC",
		address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		image: "https://etherscan.io/token/images/centre-usdc_28.png",
	},
	{
		chain: 1,
		symbol: "USDT",
		name: "Tether USD",
		address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
		image: "https://etherscan.io/token/images/tethernew_32.svg",
	},
	{
		chain: 1,
		symbol: "stETH",
		name: "Lido Staked Ether",
		address: "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
		image: "https://etherscan.io/token/images/steth_32.svg",
	},
	{
		chain: 1,
		symbol: "AAVE",
		name: "Aave Token",
		address: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
		image: "https://etherscan.io/token/images/aaverplce_32.svg",
	},
	{
		chain: 1,
		symbol: "UNI",
		name: "Uniswap",
		address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
		image: "https://etherscan.io/token/images/uniswap_ofc_32.svg",
	},
	{
		chain: 1,
		symbol: "LINK",
		name: "Chainlink",
		address: "0x514910771af9ca656af840dff83e8264ecf986ca",
		image: "https://etherscan.io/token/images/chainlink_ofc_32.svg",
	},

	{
		chain: 1,
		symbol: "SHIB",
		name: "SHIBA INU",
		address: "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
		image: "https://etherscan.io/token/images/shibainu_ofc_32.svg",
	},
	{
		chain: 1,
		symbol: "DAI",
		name: "Dai Stablecoin",
		address: "0x6b175474e89094c44da98b954eedeac495271d0f",
		image: "https://etherscan.io/token/images/dairplce_32.svg",
	},
	{
		chain: 1,
		symbol: "WBTC",
		name: "Wrapped BTC",
		address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
		image: "https://etherscan.io/token/images/wrappedbtc_ofc_32.svg",
	},
	{
		chain: 1,
		symbol: "WETH",
		name: "Wrapped Ether",
		address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
		image: "https://etherscan.io/token/images/weth_28.png?v=2",
	},
	{
		chain: 1,
		symbol: "PYUSD",
		name: "PayPal USD",
		address: "0x6c3ea9036406852006290770bedfcaba0e23a0e8",
		image: "https://etherscan.io/token/images/paypalusd_32.png",
	},
];

function Tokens(props: { onClose?: () => void }) {
	const frames = useFrames();

	return (
		<Command.Group className="p-2" heading={<h2 className="px-2.5 my-2 text-xs font-semibold text-gray-900">Tokens</h2>}>
			{tokens.map((token) => {
				async function onSelect() {
					await frames.push(getAddress(token.address), null);

					if (props.onClose) {
						props.onClose();
					}
				}

				return (
					<Command.Item
						onSelect={onSelect}
						key={token.chain + token.address}
						className="group flex justify-between select-none items-center rounded-md px-2.5 py-1.5 gap-2 relative cursor-pointer aria-selected:bg-gray-100"
					>
						<div className="flex items-center gap-2.5 min-w-0">
							<div className="shrink-0 rounded-full overflow-hidden size-4">
								<img alt="" src={token.image} />
							</div>

							<div className="flex items-center gap-1">
								<span className="text-sm">{token.name}</span>
								<span className="text-sm text-gray-500">({token.symbol})</span>
							</div>
						</div>
					</Command.Item>
				);
			})}
		</Command.Group>
	);
}
