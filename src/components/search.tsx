import clsx from "clsx";
import * as v from "valibot";
import { useState } from "react";
import { getAddress, isAddress } from "viem";
import { Command, useCommandState } from "cmdk";
import { Select } from "@base-ui/react/select";

import { isMobile } from "@/helpers";
import { TxHashSchema } from "@/schema";
import { ChainLogo } from "./chain-logo";
import type { Chain } from "@/constants";
import { frame, getFrame } from "@/frames/frame";
import { useFrames } from "@/frames/frame-context";
import { ChevronUpDownIcon, SearchIcon, XIcon } from "./icons";

interface SearchProps {
	onClose?: () => void;
}

function getSearchFrame(chain: Chain, search: string) {
	if (isAddress(search)) {
		return getFrame(frame.format({ type: "address", data: getAddress(search) }));
	}

	const hash = v.safeParse(TxHashSchema, search);

	if (hash.success) {
		return getFrame(frame.format({ type: "chain-tx-hash", data: { chain, tx_hash: hash.output } }));
	}

	return getFrame(search);
}

export function Search(props: SearchProps) {
	const frames = useFrames();

	const [search, setSearch] = useState("");
	const [chain, setChain] = useState<Chain>(1);

	async function onPaste() {
		const search = await navigator.clipboard.readText();

		const parsed = getSearchFrame(chain, search);

		if (!parsed) {
			return;
		}

		if (props.onClose) {
			props.onClose();
		}

		frames.push(parsed.raw, null);
	}

	return (
		<Command className="bg-white shadow-xl w-full rounded-none sm:rounded-lg ring-1 ring-black/5 outline-hidden overflow-hidden">
			<div className="flex flex-col flex-1 min-h-screen md:min-h-0">
				<div className="relative flex items-center border-b border-gray-100">
					<SearchIcon className="shrink-0 absolute text-gray-500 size-4 start-4" />

					<Command.Input
						value={search}
						onPaste={onPaste}
						onValueChange={setSearch}
						placeholder={isMobile() ? "Search..." : "Search tokens, transactions, accounts..."}
						className="w-full min-w-0 placeholder-gray-500 bg-transparent border-0 text-gray-900 focus:ring-0 focus:outline-hidden text-sm h-11 md:h-12 px-4 ps-11"
					/>

					<div className="flex shrink-0 items-center gap-1 pr-2.5" onKeyDown={(event) => event.stopPropagation()}>
						<ChainSelect value={chain} onValueChange={setChain} />

						{!!props.onClose && (
							<button
								type="button"
								onClick={props.onClose}
								className={clsx(
									"hover:text-gray-500 hover:bg-gray-100",
									"focus:outline-hidden focus-visible:outline-0",
									"focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:border-blue-300",
									"disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:cursor-not-allowed aria-disabled:opacity-75",
									"cursor-pointer inline-flex items-center rounded-md shrink-0 p-1.5 text-gray-400 border border-transparent",
								)}
							>
								<XIcon className="shrink-0 size-4" />
							</button>
						)}
					</div>
				</div>

				<Command.List className="outline-hidden overflow-y-auto grow sm:h-[398px]">
					<EmptyState chain={chain} />

					<Tokens chain={chain} onClose={props.onClose} />
				</Command.List>
			</div>
		</Command>
	);
}

const chains = [
	{ value: 1, label: "Ethereum" },
	{ value: 42161, label: "Arbitrum" },
	{ value: 8453, label: "Base" },
] satisfies { value: Chain; label: string }[];

function ChainSelect(props: { value: Chain; onValueChange: (chain: Chain) => void }) {
	return (
		<Select.Root
			items={chains}
			value={props.value}
			onValueChange={(value) => {
				if (value !== null) {
					props.onValueChange(value);
				}
			}}
		>
			<Select.Trigger
				aria-label="Chain"
				className="inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-sm text-gray-400 cursor-pointer hover:text-gray-500 hover:bg-gray-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-200 border border-transparent focus-visible:border-blue-300"
			>
				<ChainLogo chain={props.value} />

				<Select.Value />

				<Select.Icon className="">
					<ChevronUpDownIcon className="size-4" aria-hidden="true" />
				</Select.Icon>
			</Select.Trigger>

			<Select.Portal>
				<Select.Positioner alignItemWithTrigger className="z-50">
					<Select.Popup className="min-w-[calc(var(--anchor-width)+0.5rem)] rounded-lg bg-white p-1 shadow-lg ring-1 ring-black/5 outline-hidden">
						<Select.List>
							{chains.map((chain) => (
								<Select.Item
									key={chain.value}
									value={chain.value}
									className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2.5 py-1 text-sm text-gray-900 outline-hidden data-highlighted:bg-gray-100"
								>
									<ChainLogo chain={chain.value} />
									<Select.ItemText>{chain.label}</Select.ItemText>
								</Select.Item>
							))}
						</Select.List>
					</Select.Popup>
				</Select.Positioner>
			</Select.Portal>
		</Select.Root>
	);
}

function EmptyState(props: { chain: Chain }) {
	const search = useCommandState((state) => state.search);

	if (search === "") {
		return null;
	}

	if (getSearchFrame(props.chain, search)) {
		return null;
	}

	return (
		<Command.Empty className="p-8">
			<p className="text-sm text-center text-gray-900">No results found. Please try again.</p>
		</Command.Empty>
	);
}

const tokens = [
	{
		chain: 8453,
		name: "USDC",
		symbol: "USDC",
		address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
		image: "https://etherscan.io/token/images/centre-usdc_28.png",
	},
	{
		chain: 8453,
		name: "Wrapped Ether",
		symbol: "WETH",
		address: "0x4200000000000000000000000000000000000006",
		image: "https://etherscan.io/token/images/weth_28.png?v=2",
	},
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
	{
		chain: 42161,
		name: "USDC",
		symbol: "USDC",
		address: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
		image: "https://etherscan.io/token/images/centre-usdc_28.png",
	},
	{
		chain: 42161,
		symbol: "USDT",
		name: "Tether USD",
		address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", // Migrated to USDT0.
		image: "https://etherscan.io/token/images/tethernew_32.svg",
	},
	{
		chain: 42161,
		symbol: "AAVE",
		name: "Aave Token",
		address: "0xba5ddd1f9d7f570dc94a51479a000e3bce967196",
		image: "https://etherscan.io/token/images/aaverplce_32.svg",
	},
	{
		chain: 42161,
		symbol: "UNI",
		name: "Uniswap",
		address: "0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0",
		image: "https://etherscan.io/token/images/uniswap_ofc_32.svg",
	},
	{
		chain: 42161,
		symbol: "LINK",
		name: "Chainlink",
		address: "0xf97f4df75117a78c1a5a0dbb814af92458539fb4",
		image: "https://etherscan.io/token/images/chainlink_ofc_32.svg",
	},
	{
		chain: 42161,
		symbol: "SHIB",
		name: "SHIBA INU",
		address: "0x5033833c9fe8b9d3e09eed2f73d2aaf7e3872fd1",
		image: "https://etherscan.io/token/images/shibainu_ofc_32.svg",
	},
	{
		chain: 42161,
		symbol: "DAI",
		name: "Dai Stablecoin",
		address: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
		image: "https://etherscan.io/token/images/dairplce_32.svg",
	},
	{
		chain: 42161,
		symbol: "WBTC",
		name: "Wrapped BTC",
		address: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
		image: "https://etherscan.io/token/images/wrappedbtc_ofc_32.svg",
	},
	{
		chain: 42161,
		symbol: "WETH",
		name: "Wrapped Ether",
		address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
		image: "https://etherscan.io/token/images/weth_28.png?v=2",
	},
	{
		chain: 42161,
		symbol: "PYUSD",
		name: "PayPal USD",
		address: "0x46850ad61c2b7d64d08c9c754f45254596696984",
		image: "https://etherscan.io/token/images/paypalusd_32.png",
	},
];

function Tokens(props: { chain: Chain; onClose?: () => void }) {
	const frames = useFrames();

	return (
		<Command.Group className="p-2" heading={<h2 className="px-2.5 my-2 text-xs font-semibold text-gray-900">Tokens</h2>}>
			{tokens
				.filter((token) => token.chain === props.chain)
				.map((token) => {
					async function onSelect() {
						await frames.push(frame.format({ type: "address", data: getAddress(token.address) }), null);

						if (props.onClose) {
							props.onClose();
						}
					}

					return (
						<Command.Item
							onSelect={onSelect}
							key={token.symbol}
							value={`${token.name} ${token.symbol}`}
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
