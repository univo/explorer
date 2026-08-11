CREATE TABLE "log_uniswap_v3_pool_created_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"fee" integer NOT NULL,
	"tick_spacing" integer NOT NULL,
	"pool_address" "bytea" NOT NULL,
	"token_0_address" "bytea" NOT NULL,
	"token_1_address" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log_uniswap_v3_swap_v1" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"tick" integer NOT NULL,
	"amount_0" numeric(78, 0) NOT NULL,
	"amount_1" numeric(78, 0) NOT NULL,
	"liquidity" numeric(39, 0) NOT NULL,
	"pool_address" "bytea" NOT NULL,
	"sender_address" "bytea" NOT NULL,
	"recipient_address" "bytea" NOT NULL,
	"sqrt_price_x96" numeric(49, 0) NOT NULL
);
--> statement-breakpoint
CREATE INDEX "log_uniswap_v3_pool_created_v1_pool_address_idx" ON "log_uniswap_v3_pool_created_v1" USING btree ("pool_address");--> statement-breakpoint
CREATE INDEX "log_uniswap_v3_pool_created_v1_token_0_address_idx" ON "log_uniswap_v3_pool_created_v1" USING btree ("token_0_address");--> statement-breakpoint
CREATE INDEX "log_uniswap_v3_pool_created_v1_token_1_address_idx" ON "log_uniswap_v3_pool_created_v1" USING btree ("token_1_address");--> statement-breakpoint
CREATE INDEX "log_uniswap_v3_swap_v1_pool_address_idx" ON "log_uniswap_v3_swap_v1" USING btree ("pool_address");--> statement-breakpoint

CREATE MATERIALIZED VIEW "view_prices_v1" AS
WITH
"pricing_config" AS (
	SELECT
		1::integer AS "chain",
		decode('a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'hex') AS "usdc_address",
		decode('c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', 'hex') AS "weth_address",
		79228162514264337593543950336::numeric AS "q96"
),
"monthly_boundaries" AS (
	SELECT generate_series(
		TIMESTAMPTZ '2021-06-01 00:00:00+00',
		date_trunc('month', CURRENT_TIMESTAMP, 'UTC'),
		INTERVAL '1 month'
	) AS "period_end"
),
"official_swaps" AS (
	SELECT
		(
			get_byte("swap"."id", 13) * 256
			+ get_byte("swap"."id", 14)
		)::integer AS "chain",
		to_timestamp(
			get_byte("swap"."id", 0)::bigint * 16777216
			+ get_byte("swap"."id", 1)::bigint * 65536
			+ get_byte("swap"."id", 2)::bigint * 256
			+ get_byte("swap"."id", 3)::bigint
		) AS "observed_at",
		"swap"."id" AS "swap_id",
		"swap"."pool_address",
		"swap"."sqrt_price_x96",
		"swap"."liquidity",
		"pool"."token_0_address",
		"pool"."token_1_address"
	FROM "log_uniswap_v3_swap_v1" AS "swap"
	INNER JOIN "log_uniswap_v3_pool_created_v1" AS "pool"
		ON "pool"."pool_address" = "swap"."pool_address"
		AND get_byte("pool"."id", 13) = get_byte("swap"."id", 13)
		AND get_byte("pool"."id", 14) = get_byte("swap"."id", 14)
),
"swaps_with_decimals" AS (
	SELECT
		"swap".*,
		"token_0"."erc20.decimals" AS "token_0_decimals",
		"token_1"."erc20.decimals" AS "token_1_decimals"
	FROM "official_swaps" AS "swap"
	INNER JOIN "state_accounts_v3" AS "token_0"
		ON "token_0"."chain" = "swap"."chain"
		AND lower("token_0"."address") = '0x' || encode("swap"."token_0_address", 'hex')
		AND "token_0"."erc20.decimals" IS NOT NULL
	INNER JOIN "state_accounts_v3" AS "token_1"
		ON "token_1"."chain" = "swap"."chain"
		AND lower("token_1"."address") = '0x' || encode("swap"."token_1_address", 'hex')
		AND "token_1"."erc20.decimals" IS NOT NULL
),
"ranked_pool_closes" AS (
	SELECT
		"month"."period_end",
		"swap".*,
		row_number() OVER (
			PARTITION BY "swap"."chain", "swap"."pool_address", "month"."period_end"
			ORDER BY "swap"."swap_id" DESC
		) AS "position"
	FROM "monthly_boundaries" AS "month"
	INNER JOIN "swaps_with_decimals" AS "swap"
		ON "swap"."observed_at" < "month"."period_end"
		AND "swap"."observed_at" >= "month"."period_end" - INTERVAL '31 days'
),
"pool_closes" AS (
	SELECT
		"chain",
		"period_end",
		"observed_at",
		"pool_address",
		"token_0_address",
		"token_1_address",
		"token_0_decimals",
		"token_1_decimals",
		"sqrt_price_x96",
		"liquidity"
	FROM "ranked_pool_closes"
	WHERE "position" = 1
),
"pool_prices" AS (
	SELECT
		"close".*,
		power("close"."sqrt_price_x96", 2)
			/ power("config"."q96", 2)
			* power(10::numeric, "close"."token_0_decimals" - "close"."token_1_decimals")
			AS "token_1_per_token_0",
		"close"."liquidity" * "config"."q96" / "close"."sqrt_price_x96"
			/ power(10::numeric, "close"."token_0_decimals")
			AS "virtual_token_0",
		"close"."liquidity" * "close"."sqrt_price_x96" / "config"."q96"
			/ power(10::numeric, "close"."token_1_decimals")
			AS "virtual_token_1"
	FROM "pool_closes" AS "close"
	INNER JOIN "pricing_config" AS "config" USING ("chain")
),
"directed_edges" AS (
	SELECT
		"chain",
		"period_end",
		"observed_at",
		"pool_address",
		"token_0_address" AS "base_token_address",
		"token_1_address" AS "quote_token_address",
		"token_1_per_token_0" AS "quote_per_base",
		"virtual_token_1" AS "quote_depth"
	FROM "pool_prices"

	UNION ALL

	SELECT
		"chain",
		"period_end",
		"observed_at",
		"pool_address",
		"token_1_address" AS "base_token_address",
		"token_0_address" AS "quote_token_address",
		1 / "token_1_per_token_0" AS "quote_per_base",
		"virtual_token_0" AS "quote_depth"
	FROM "pool_prices"
),
"direct_usdc_candidates" AS (
	SELECT
		"edge"."chain",
		"edge"."base_token_address" AS "token_address",
		"edge"."period_end",
		"edge"."quote_per_base" AS "price_usd",
		'direct'::text AS "route",
		"edge"."pool_address" AS "pool_0_address",
		NULL::bytea AS "pool_1_address",
		"edge"."observed_at",
		"edge"."quote_depth" AS "depth_usd"
	FROM "directed_edges" AS "edge"
	INNER JOIN "pricing_config" AS "config" USING ("chain")
	WHERE "edge"."quote_token_address" = "config"."usdc_address"
		AND "edge"."base_token_address" <> "config"."usdc_address"
),
"weth_candidates" AS (
	SELECT
		"token_weth"."chain",
		"token_weth"."base_token_address" AS "token_address",
		"token_weth"."period_end",
		"token_weth"."quote_per_base" * "weth_usdc"."quote_per_base" AS "price_usd",
		'weth'::text AS "route",
		"token_weth"."pool_address" AS "pool_0_address",
		"weth_usdc"."pool_address" AS "pool_1_address",
		least("token_weth"."observed_at", "weth_usdc"."observed_at") AS "observed_at",
		least(
			"token_weth"."quote_depth" * "weth_usdc"."quote_per_base",
			"weth_usdc"."quote_depth"
		) AS "depth_usd"
	FROM "directed_edges" AS "token_weth"
	INNER JOIN "pricing_config" AS "config" USING ("chain")
	INNER JOIN "directed_edges" AS "weth_usdc"
		ON "weth_usdc"."chain" = "token_weth"."chain"
		AND "weth_usdc"."period_end" = "token_weth"."period_end"
		AND "weth_usdc"."base_token_address" = "config"."weth_address"
		AND "weth_usdc"."quote_token_address" = "config"."usdc_address"
	WHERE "token_weth"."quote_token_address" = "config"."weth_address"
		AND "token_weth"."base_token_address" <> "config"."usdc_address"
),
"price_candidates" AS (
	SELECT * FROM "direct_usdc_candidates"
	UNION ALL
	SELECT * FROM "weth_candidates"
),
"ranked_prices" AS (
	SELECT
		"candidate".*,
		row_number() OVER (
			PARTITION BY "candidate"."chain", "candidate"."token_address", "candidate"."period_end"
			ORDER BY
				"candidate"."depth_usd" DESC,
				CASE WHEN "candidate"."route" = 'direct' THEN 0 ELSE 1 END,
				"candidate"."observed_at" DESC,
				"candidate"."pool_0_address",
				"candidate"."pool_1_address" NULLS FIRST
		) AS "position"
	FROM "price_candidates" AS "candidate"
),
"winning_prices" AS (
	SELECT
		"chain",
		"token_address",
		"period_end",
		"price_usd",
		"route",
		"pool_0_address",
		"pool_1_address",
		"observed_at",
		"depth_usd"
	FROM "ranked_prices"
	WHERE "position" = 1
),
"usdc_prices" AS (
	SELECT
		"config"."chain",
		"config"."usdc_address" AS "token_address",
		"month"."period_end",
		1::numeric AS "price_usd",
		'usdc'::text AS "route",
		NULL::bytea AS "pool_0_address",
		NULL::bytea AS "pool_1_address",
		"month"."period_end" AS "observed_at",
		NULL::numeric AS "depth_usd"
	FROM "pricing_config" AS "config"
	CROSS JOIN "monthly_boundaries" AS "month"
)
SELECT * FROM "winning_prices"
UNION ALL
SELECT * FROM "usdc_prices"
WITH NO DATA;--> statement-breakpoint

CREATE UNIQUE INDEX "view_prices_v1_chain_token_period_idx"
ON "view_prices_v1" USING btree ("chain", "token_address", "period_end");
