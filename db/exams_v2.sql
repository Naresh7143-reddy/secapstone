-- Phase 5.1: richer questions + test-case judging + AI review.
-- Run in Supabase SQL Editor.

ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS input_format TEXT DEFAULT '';
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS output_format TEXT DEFAULT '';
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS constraints TEXT DEFAULT '';
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS sample_test_cases JSONB DEFAULT '[]';
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS hidden_test_cases JSONB DEFAULT '[]';
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS supported_languages JSONB DEFAULT '["python","java","cpp"]';
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS reference_solution TEXT DEFAULT '';
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

ALTER TABLE exam_submissions ADD COLUMN IF NOT EXISTS language VARCHAR(50);
ALTER TABLE exam_submissions ADD COLUMN IF NOT EXISTS tests_passed INTEGER DEFAULT 0;
ALTER TABLE exam_submissions ADD COLUMN IF NOT EXISTS tests_total INTEGER DEFAULT 0;
ALTER TABLE exam_submissions ADD COLUMN IF NOT EXISTS ai_review JSONB;

-- Reusable question library (searchable bank of predefined problems)
CREATE TABLE IF NOT EXISTS question_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  problem_statement TEXT,
  input_format TEXT,
  output_format TEXT,
  constraints TEXT,
  difficulty VARCHAR(20) DEFAULT 'easy',
  tags JSONB DEFAULT '[]',
  sample_test_cases JSONB DEFAULT '[]',
  hidden_test_cases JSONB DEFAULT '[]',
  supported_languages JSONB DEFAULT '["python","java","cpp"]',
  default_points INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qlib_difficulty ON question_library(difficulty);
