ALTER TABLE "state_tokens_v1" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "state_tokens_v1" CASCADE;--> statement-breakpoint
ALTER TABLE "state_accounts_v3" ALTER COLUMN "erc20.decimals" SET DATA TYPE smallint USING "erc20.decimals"::smallint;--> statement-breakpoint
ALTER TABLE "state_accounts_v3" ADD COLUMN "erc20.image" text;