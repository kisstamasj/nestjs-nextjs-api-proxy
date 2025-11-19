ALTER TABLE "tokens" RENAME TO "sessions";--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "tokens_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "tokens_pk";--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_pk" PRIMARY KEY("user_id","refresh_token");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;