CREATE TABLE "tokens" (
	"user_id" uuid NOT NULL,
	"refresh_token" uuid NOT NULL,
	"user_agent" text NOT NULL,
	"ip_address" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tokens_pk" PRIMARY KEY("user_id","refresh_token")
);
--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;