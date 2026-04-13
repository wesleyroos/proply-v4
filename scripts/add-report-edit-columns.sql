-- Add report editing columns to valuation_reports
-- Allows agents/partners to adjust AI-generated values

ALTER TABLE valuation_reports
  ADD COLUMN IF NOT EXISTS edit_token TEXT,
  ADD COLUMN IF NOT EXISTS original_valuation_data JSONB,
  ADD COLUMN IF NOT EXISTS manual_overrides JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_edited_by TEXT;
