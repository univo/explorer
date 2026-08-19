import { Fragment } from "react";
import { sql } from "drizzle-orm";
import { getAddress, isAddressEqual } from "viem";

import { Img } from "./img";
import { Account } from "./account";
import { Hoverable } from "./hoverable";
import { AddViewButton } from "./views";
import { Description } from "./description";
import { getErc20Account } from "@/state/account";
import { createPostgresClient } from "@/db/client";
import { ETH_ADDRESS, type Chain } from "@/constants";
import { defineLoader, formatNumber, isHexEqual } from "@/utils";

const WETH_ADDRESS = getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

export async function Erc20(props: { chain: Chain; address: `0x${string}`; quantity?: `0x${string}` | bigint; at: number }) {
	const timestamp = new Date(props.at * 1000);

	if (props.chain === 1 && isAddressEqual(props.address, ETH_ADDRESS)) {
		const price = await getTokenPrice({ chain: props.chain, token: props.address, timestamp });

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

				<Price price={price?.price_usd} />
			</Fragment>
		);
	}

	const [account, price] = await Promise.all([
		getErc20Account({ chain: props.chain, address: props.address }),
		getTokenPrice({ chain: props.chain, token: props.address, timestamp }),
	]);

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

			<Price price={price?.price_usd} />
		</Fragment>
	);
}

function Quantity(props: { decimals: number; quantity: `0x${string}` | bigint | undefined }) {
	if (props.quantity === undefined) {
		return null;
	}

	return <span>{formatTokenQuantity(props.quantity, props.decimals)}</span>;
}

function formatTokenQuantity(quantity: `0x${string}` | bigint, decimals: number) {
	const quantityAsInteger = Number(quantity);
	const quantityAsString = String(quantityAsInteger);
	const quantityAsNumber = quantityAsInteger / 10 ** decimals;

	if (decimals > quantityAsString.length) {
		return formatNumber(quantityAsNumber, { maximumSignificantDigits: 2 });
	}

	return formatNumber(quantityAsNumber, { maximumFractionDigits: 2 });
}

function Price(props: { price: string | undefined }) {
	if (props.price === undefined) {
		return null;
	}

	return <span className="text-gray-500 select-all">(${formatTokenPrice(props.price)})</span>;
}

function formatTokenPrice(price: string) {
	const priceAsNumber = Number(price);

	if (priceAsNumber < 1) {
		return formatNumber(priceAsNumber, { maximumSignificantDigits: 4 });
	}

	return formatNumber(priceAsNumber, { maximumFractionDigits: 2 });
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

interface TokenPrice {
	chain: Chain;
	token: `0x${string}`;
	period_end: Date;
	price_usd: string;
	observed_at: Date;
	depth_usd: string | null;
	route: "usdc" | "direct" | "weth";
	pool_0_address: `0x${string}` | null;
	pool_1_address: `0x${string}` | null;
}

interface TokenPriceRow extends Record<string, unknown> {
	chain: Chain;
	token_address: `0x${string}`;
	price_usd: string;
	period_end: string;
	observed_at: string;
	depth_usd: string | null;
	route: TokenPrice["route"];
	pool_0_address: `0x${string}` | null;
	pool_1_address: `0x${string}` | null;
}

type TokenPriceInput = { chain: Chain; token: `0x${string}`; timestamp: Date };

const getTokenPrice = defineLoader(async (inputs: readonly TokenPriceInput[]) => {
	if (inputs.length === 0) {
		return [];
	}

	const requests = inputs.map((input) => {
		const token = getAddress(input.token);
		const queryToken = input.chain === 1 && isAddressEqual(token, ETH_ADDRESS) ? WETH_ADDRESS : token;
		const periodEnd = new Date(Date.UTC(input.timestamp.getUTCFullYear(), input.timestamp.getUTCMonth(), 1));

		return { ...input, token, queryToken, periodEnd };
	});

	const unique = new Map<string, (typeof requests)[number]>();

	for (const request of requests) {
		unique.set(`${request.chain}:${request.queryToken.toLowerCase()}:${request.periodEnd.getTime()}`, request);
	}

	const tuples = [...unique.values()].map((request) => {
		return sql`(${request.chain}, decode(${request.queryToken.slice(2)}, 'hex'), ${request.periodEnd})`;
	});

	const client = await createPostgresClient();

	const result = await client.execute<TokenPriceRow>(sql`
		SELECT
			"chain",
			'0x' || encode("token_address", 'hex') AS "token_address",
			"price_usd"::text AS "price_usd",
			"period_end",
			"observed_at",
			"route",
			CASE WHEN "pool_0_address" IS NULL THEN NULL ELSE '0x' || encode("pool_0_address", 'hex') END AS "pool_0_address",
			CASE WHEN "pool_1_address" IS NULL THEN NULL ELSE '0x' || encode("pool_1_address", 'hex') END AS "pool_1_address",
			"depth_usd"::text AS "depth_usd"
		FROM "view_prices_v1"
		WHERE ("chain", "token_address", "period_end") IN (${sql.join(tuples, sql`, `)})
	`);

	return requests.map<TokenPrice | null>((request) => {
		const row = result.rows.find((row) => {
			return (
				row.chain === request.chain &&
				isHexEqual(row.token_address, request.queryToken) &&
				new Date(row.period_end).getTime() === request.periodEnd.getTime()
			);
		});

		if (row === undefined) {
			return null;
		}

		return {
			route: row.route,
			chain: request.chain,
			token: request.token,
			price_usd: row.price_usd,
			depth_usd: row.depth_usd,
			period_end: new Date(row.period_end),
			observed_at: new Date(row.observed_at),
			pool_0_address: row.pool_0_address === null ? null : getAddress(row.pool_0_address),
			pool_1_address: row.pool_1_address === null ? null : getAddress(row.pool_1_address),
		};
	});
});
