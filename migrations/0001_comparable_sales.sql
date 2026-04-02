CREATE TABLE IF NOT EXISTS "comparable_sales" (
  "id"                 serial PRIMARY KEY,
  "address_normalised" text NOT NULL,
  "address"            text NOT NULL,
  "suburb"             text,
  "city"               text,
  "erf_number"         text,
  "latitude"           decimal(10, 7),
  "longitude"          decimal(10, 7),
  "property_type"      text,
  "bedrooms"           decimal(3, 1),
  "bathrooms"          decimal(3, 1),
  "floor_size"         integer,
  "erf_size"           integer,
  "sale_price"         integer NOT NULL,
  "price_per_sqm"      integer,
  "sale_date"          text,
  "source"             text NOT NULL DEFAULT 'knowledgeFactory',
  "title_deed_no"      text,
  "seen_count"         integer NOT NULL DEFAULT 1,
  "property_ids"       jsonb DEFAULT '[]',
  "first_seen_at"      timestamp DEFAULT now() NOT NULL,
  "last_seen_at"       timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "comparable_sales_dedup_idx"
  ON "comparable_sales" ("address_normalised", "sale_date", "sale_price");

CREATE INDEX IF NOT EXISTS "comparable_sales_suburb_idx" ON "comparable_sales" ("suburb");
CREATE INDEX IF NOT EXISTS "comparable_sales_city_idx" ON "comparable_sales" ("city");
CREATE INDEX IF NOT EXISTS "comparable_sales_property_type_idx" ON "comparable_sales" ("property_type");
CREATE INDEX IF NOT EXISTS "comparable_sales_sale_date_idx" ON "comparable_sales" ("sale_date");
CREATE INDEX IF NOT EXISTS "comparable_sales_price_per_sqm_idx" ON "comparable_sales" ("price_per_sqm");
