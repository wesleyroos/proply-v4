ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS province TEXT;
CREATE INDEX IF NOT EXISTS comparable_sales_province_idx ON comparable_sales (province);
