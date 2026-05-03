-- Migration: Change appetite column from INTEGER to TEXT
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing check constraint
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_appetite_check;

-- Step 2: Drop column and re-add as TEXT
ALTER TABLE reports DROP COLUMN appetite;
ALTER TABLE reports ADD COLUMN appetite TEXT CHECK (appetite IN ('poor', 'fair', 'good', 'excellent'));

-- Step 3: (Optional) Update existing data if any - set default to 'fair'
UPDATE reports SET appetite = 'fair' WHERE appetite IS NULL;
