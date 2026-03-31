CREATE TABLE IF NOT EXISTS "access_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"used_at" timestamp,
	"used_by" integer,
	"expires_at" timestamp,
	CONSTRAINT "access_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"agency_id" text,
	"franchise_id" integer,
	"branch_id" integer,
	"token" text NOT NULL,
	"invited_by" integer,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agency_billing_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"agency_branch_id" integer NOT NULL,
	"billing_period" text NOT NULL,
	"report_count" integer DEFAULT 0,
	"price_per_report" text NOT NULL,
	"subtotal" text NOT NULL,
	"vat_amount" text NOT NULL,
	"total_amount" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"due_date" timestamp NOT NULL,
	"paid_at" timestamp,
	"payfast_payment_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agency_billing_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"agency_branch_id" integer NOT NULL,
	"billing_enabled" boolean DEFAULT false,
	"price_per_report" text DEFAULT '200.00' NOT NULL,
	"billing_contact_email" text,
	"billing_day" integer DEFAULT 1 NOT NULL,
	"auto_billing" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agency_branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"franchise_name" text NOT NULL,
	"slug" text NOT NULL,
	"branch_name" text NOT NULL,
	"propdata_franchise_id" text,
	"propdata_branch_id" text,
	"provider" text DEFAULT 'PropData' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"auto_sync_enabled" boolean DEFAULT true NOT NULL,
	"sync_frequency" text DEFAULT '5 minutes' NOT NULL,
	"api_key" text,
	"api_base_url" text,
	"logo_url" text,
	"company_name" text,
	"vat_number" text,
	"registration_number" text,
	"business_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agency_branches_propdata_branch_id_unique" UNIQUE("propdata_branch_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agency_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"agency_id" varchar(255) NOT NULL,
	"agency_name" varchar(255) NOT NULL,
	"month" varchar(7) NOT NULL,
	"year" integer NOT NULL,
	"report_count" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"invoice_date" date NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invoice_type" text DEFAULT 'automated' NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agency_invoices_invoice_id_unique" UNIQUE("invoice_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agency_payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"agency_branch_id" integer NOT NULL,
	"payfast_token" text NOT NULL,
	"card_last_four" text NOT NULL,
	"expiry_month" integer NOT NULL,
	"expiry_year" integer NOT NULL,
	"card_brand" text,
	"is_active" boolean DEFAULT true,
	"added_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agency_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"auto_processing" boolean DEFAULT true NOT NULL,
	"notification_preferences" jsonb NOT NULL,
	"whatsapp_number" text,
	"report_settings" jsonb,
	"billing_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agency_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deal_score_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"property_address" text,
	"report_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"status" text NOT NULL,
	"invoice_number" text NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payfast_tokenization_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"agency_branch_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payfast_m_payment_id" text,
	"payfast_token" text,
	"card_last_four" text,
	"expiry_month" integer,
	"expiry_year" integer,
	"card_brand" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payfast_tokenization_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pricelabs_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"endpoint" varchar(255) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"response_time" integer,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "propdata_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"propdata_id" text NOT NULL,
	"branch_id" integer,
	"status" text NOT NULL,
	"listing_data" jsonb NOT NULL,
	"address" text NOT NULL,
	"address_manually_edited" boolean DEFAULT false NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"property_type" text NOT NULL,
	"bedrooms" numeric(3, 1) NOT NULL,
	"bathrooms" numeric(3, 1) NOT NULL,
	"parking_spaces" integer,
	"floor_size" integer,
	"land_size" integer,
	"location" jsonb,
	"features" jsonb,
	"images" jsonb,
	"agent_id" text,
	"agent_name" text,
	"agent_email" text,
	"agent_phone" text,
	"monthly_levy" numeric(10, 2),
	"sectional_title_levy" numeric(10, 2),
	"special_levy" numeric(10, 2),
	"home_owner_levy" numeric(10, 2),
	"provider" text DEFAULT 'PropData' NOT NULL,
	"title" text,
	"price_text" text,
	"rates_and_taxes" numeric(10, 2),
	"str_monthly_revenue" numeric(12, 2),
	"str_annual_revenue" numeric(12, 2),
	"str_occupancy_rate" numeric(5, 2),
	"str_avg_daily_rate" numeric(10, 2),
	"ltr_monthly_rent" numeric(12, 2),
	"ltr_annual_rent" numeric(12, 2),
	"listing_date" timestamp,
	"last_modified" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "propdata_listings_propdata_id_unique" UNIQUE("propdata_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "propdata_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"address" text NOT NULL,
	"bedrooms" text NOT NULL,
	"bathrooms" text NOT NULL,
	"long_term_rental" text NOT NULL,
	"annual_escalation" text NOT NULL,
	"short_term_nightly" text NOT NULL,
	"annual_occupancy" text NOT NULL,
	"management_fee" text NOT NULL,
	"property_type" text DEFAULT 'rent_compare' NOT NULL,
	"long_term_monthly" numeric(10, 2) NOT NULL,
	"long_term_annual" numeric(10, 2) NOT NULL,
	"short_term_monthly" numeric(10, 2) NOT NULL,
	"short_term_annual" numeric(10, 2) NOT NULL,
	"short_term_after_fees" numeric(10, 2) NOT NULL,
	"break_even_occupancy" numeric(5, 2) NOT NULL,
	"share_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "properties_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_analyzer_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"address" text NOT NULL,
	"property_url" text,
	"property_description" text,
	"property_photo" text,
	"purchase_price" numeric(12, 2) NOT NULL,
	"floor_area" numeric(10, 2) NOT NULL,
	"bedrooms" numeric(3, 1) NOT NULL,
	"bathrooms" integer NOT NULL,
	"parking_spaces" integer,
	"deposit_amount" numeric(12, 2) NOT NULL,
	"deposit_percentage" numeric(5, 2) NOT NULL,
	"interest_rate" numeric(5, 2) NOT NULL,
	"loan_term" integer NOT NULL,
	"monthly_bond_repayment" numeric(12, 2),
	"monthly_levies" numeric(10, 2) NOT NULL,
	"monthly_rates_taxes" numeric(10, 2) NOT NULL,
	"other_monthly_expenses" numeric(10, 2) NOT NULL,
	"maintenance_percent" numeric(5, 2) NOT NULL,
	"management_fee" numeric(5, 2) NOT NULL,
	"short_term_nightly_rate" numeric(10, 2),
	"annual_occupancy" numeric(5, 2),
	"short_term_annual_revenue" numeric(12, 2),
	"long_term_annual_revenue" numeric(12, 2),
	"short_term_gross_yield" numeric(5, 2),
	"long_term_gross_yield" numeric(5, 2),
	"rate_per_square_meter" numeric(10, 2) NOT NULL,
	"share_token" text,
	"long_term_rental" numeric(10, 2),
	"lease_cycle_gap" numeric(5, 2),
	"deposit_type" text,
	"annual_income_growth" numeric(5, 2),
	"annual_expense_growth" numeric(5, 2),
	"annual_property_appreciation" numeric(5, 2),
	"revenue_projections" jsonb,
	"operating_expenses" jsonb,
	"long_term_operating_expenses" jsonb,
	"net_operating_income" jsonb,
	"long_term_net_operating_income" jsonb,
	"investment_metrics" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "property_analyzer_results_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"address" text NOT NULL,
	"suburb" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"bedrooms" integer NOT NULL,
	"bathrooms" integer NOT NULL,
	"parking" integer,
	"property_type" varchar(50) NOT NULL,
	"category" varchar(50) NOT NULL,
	"area" numeric(10, 2),
	"erf_size" numeric(10, 2),
	"description" text,
	"amenities" text[],
	"image_urls" text[],
	"agent" jsonb,
	"listed_date" date,
	"sold_date" date,
	"price_history" jsonb,
	"source" varchar(50) DEFAULT 'property24' NOT NULL,
	"url" text NOT NULL,
	"scraped_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "property_listings_listing_id_unique" UNIQUE("listing_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rental_performance_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"property_id" text NOT NULL,
	"valuation_report_id" integer,
	"address" text NOT NULL,
	"bedrooms" integer,
	"bathrooms" integer,
	"property_type" text,
	"price" numeric(12, 2),
	"short_term_data" jsonb,
	"long_term_min_rental" numeric(10, 2),
	"long_term_max_rental" numeric(10, 2),
	"long_term_min_yield" numeric(5, 2),
	"long_term_max_yield" numeric(5, 2),
	"long_term_reasoning" text,
	"images_analyzed" integer DEFAULT 0,
	"analysis_model" text DEFAULT 'gpt-4o',
	"annual_property_appreciation_data" jsonb,
	"cashflow_analysis_data" jsonb,
	"financing_analysis_data" jsonb,
	"current_deposit_percentage" text,
	"current_interest_rate" text,
	"current_loan_term" integer,
	"current_deposit_amount" text,
	"current_loan_amount" text,
	"current_monthly_repayment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"report_id" text,
	"activity_type" text NOT NULL,
	"recipient_email" text,
	"recipient_name" text,
	"ip_address" text,
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"agency_id" varchar(255) NOT NULL,
	"agency_name" varchar(255) NOT NULL,
	"property_id" varchar(255) NOT NULL,
	"report_type" varchar(100) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"agency_id" integer NOT NULL,
	"status" text NOT NULL,
	"report_url" text,
	"cost" numeric(10, 2) NOT NULL,
	"billing_status" text NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"scope" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" text NOT NULL,
	"payfast_token" text NOT NULL,
	"performed_at" timestamp DEFAULT now() NOT NULL,
	"pause_duration" integer,
	"reason" text,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"sync_type" text NOT NULL,
	"status" text NOT NULL,
	"agency_id" integer,
	"provider" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"new_listings" integer DEFAULT 0,
	"updated_listings" integer DEFAULT 0,
	"errors" integer DEFAULT 0,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transaction_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"agency_id" varchar(255) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payfast_transaction_id" text,
	"payfast_payment_id" text,
	"payment_method_id" text,
	"status" text NOT NULL,
	"gateway_response" jsonb,
	"error_message" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_history_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"user_type" text NOT NULL,
	"company" text,
	"first_name" text,
	"last_name" text,
	"company_logo" text,
	"vat_number" text,
	"registration_number" text,
	"business_address" text,
	"subscription_status" text DEFAULT 'free' NOT NULL,
	"subscription_expiry_date" timestamp,
	"subscription_start_date" timestamp,
	"subscription_next_billing_date" timestamp,
	"pending_downgrade" boolean DEFAULT false,
	"payfast_token" text,
	"payfast_subscription_status" text DEFAULT 'none',
	"subscription_paused_until" timestamp,
	"is_admin" boolean DEFAULT false NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"franchise_id" integer,
	"branch_id" integer,
	"access_code_id" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reports_generated" integer DEFAULT 0 NOT NULL,
	"analysis_count" integer DEFAULT 0 NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "valuation_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"property_id" text NOT NULL,
	"address" text NOT NULL,
	"price" numeric(12, 2),
	"bedrooms" integer,
	"bathrooms" integer,
	"floor_size" numeric(10, 2),
	"land_size" numeric(10, 2),
	"property_type" text,
	"parking_spaces" integer,
	"price_per_square_meter" numeric(10, 2),
	"valuation_data" jsonb NOT NULL,
	"images_analyzed" integer DEFAULT 0,
	"analysis_model" text DEFAULT 'gpt-4o',
	"current_deposit_percentage" numeric(5, 2) DEFAULT '20.00',
	"current_interest_rate" numeric(5, 2) DEFAULT '11.75',
	"current_loan_term" integer DEFAULT 20,
	"current_deposit_amount" numeric(12, 2),
	"current_loan_amount" numeric(12, 2),
	"current_monthly_repayment" numeric(10, 2),
	"annual_property_appreciation_data" jsonb,
	"cashflow_analysis_data" jsonb,
	"financing_analysis_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_franchise_id_agency_branches_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."agency_branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_branch_id_agency_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."agency_branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agency_billing_cycles" ADD CONSTRAINT "agency_billing_cycles_agency_branch_id_agency_branches_id_fk" FOREIGN KEY ("agency_branch_id") REFERENCES "public"."agency_branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agency_billing_settings" ADD CONSTRAINT "agency_billing_settings_agency_branch_id_agency_branches_id_fk" FOREIGN KEY ("agency_branch_id") REFERENCES "public"."agency_branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agency_payment_methods" ADD CONSTRAINT "agency_payment_methods_agency_branch_id_agency_branches_id_fk" FOREIGN KEY ("agency_branch_id") REFERENCES "public"."agency_branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agency_payment_methods" ADD CONSTRAINT "agency_payment_methods_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payfast_tokenization_sessions" ADD CONSTRAINT "payfast_tokenization_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payfast_tokenization_sessions" ADD CONSTRAINT "payfast_tokenization_sessions_agency_branch_id_agency_branches_id_fk" FOREIGN KEY ("agency_branch_id") REFERENCES "public"."agency_branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pricelabs_usage" ADD CONSTRAINT "pricelabs_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_generations" ADD CONSTRAINT "report_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction_history" ADD CONSTRAINT "transaction_history_invoice_id_agency_invoices_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."agency_invoices"("invoice_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_franchise_id_agency_branches_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."agency_branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_agency_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."agency_branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
