ALTER TABLE "tokens" ADD COLUMN "previous_refresh_token" text;--> statement-breakpoint
ALTER TABLE "tokens" ADD COLUMN "previous_refresh_token_expires_at" timestamp;