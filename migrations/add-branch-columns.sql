-- Add home_branch column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_branch VARCHAR;

-- Add branch column to check_ins table
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS branch VARCHAR;

-- Create index on check_ins.branch for efficient filtering
CREATE INDEX IF NOT EXISTS "IDX_check_ins_branch" ON check_ins(branch);

-- Drop legacy one_time_qr_codes table if exists (no longer used)
DROP TABLE IF EXISTS one_time_qr_codes;
