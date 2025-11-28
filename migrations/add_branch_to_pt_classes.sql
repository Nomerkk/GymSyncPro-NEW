-- Add branch column to gym_classes
ALTER TABLE gym_classes ADD COLUMN IF NOT EXISTS branch VARCHAR;

-- Add branch column to personal_trainers
ALTER TABLE personal_trainers ADD COLUMN IF NOT EXISTS branch VARCHAR;

-- Update existing gym_classes to have a default branch (Jakarta Pusat)
UPDATE gym_classes SET branch = 'Jakarta Pusat' WHERE branch IS NULL;

-- Update existing personal_trainers to have a default branch (Jakarta Pusat)
UPDATE personal_trainers SET branch = 'Jakarta Pusat' WHERE branch IS NULL;

-- Create index for branch filtering
CREATE INDEX IF NOT EXISTS IDX_gym_classes_branch ON gym_classes(branch);
CREATE INDEX IF NOT EXISTS IDX_personal_trainers_branch ON personal_trainers(branch);
