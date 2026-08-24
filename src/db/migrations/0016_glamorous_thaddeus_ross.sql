ALTER TABLE "intent_erc721_approval_v1" ALTER COLUMN "token_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "intent_erc721_approval_v1" DROP COLUMN "approved";