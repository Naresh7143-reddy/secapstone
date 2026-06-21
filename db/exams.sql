-- Phase 5: Exams, questions, submissions (run in Supabase SQL Editor).
-- Note: user ids are Firebase UIDs (TEXT) after the earlier migration.

CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL,
  title VARCHAR(255) NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20) DEFAULT 'easy',
  language VARCHAR(50) DEFAULT 'python',
  starter_code TEXT DEFAULT '',
  points INTEGER DEFAULT 10,
  position INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS exam_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID REFERENCES exam_questions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name VARCHAR(255),
  code TEXT,
  status VARCHAR(50),
  score INTEGER DEFAULT 0,
  flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  paste_count INTEGER DEFAULT 0,
  blur_count INTEGER DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(question_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_exams_classroom ON exams(classroom_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_examsub_exam ON exam_submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_examsub_user ON exam_submissions(user_id);
