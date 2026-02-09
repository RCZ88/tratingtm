-- Add weekly_ratings table and relax ratings uniqueness
ALTER TABLE ratings
  DROP CONSTRAINT IF EXISTS ratings_teacher_id_anonymous_id_key;

CREATE TABLE IF NOT EXISTS weekly_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  anonymous_id VARCHAR(255) NOT NULL,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  week_start DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, anonymous_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_ratings_teacher_week ON weekly_ratings(teacher_id, week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_ratings_week ON weekly_ratings(week_start);

ALTER TABLE weekly_ratings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'weekly_ratings'
      AND policyname = 'Public can view weekly ratings'
  ) THEN
    CREATE POLICY "Public can view weekly ratings" ON weekly_ratings
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'weekly_ratings'
      AND policyname = 'Anyone can submit weekly ratings'
  ) THEN
    CREATE POLICY "Anyone can submit weekly ratings" ON weekly_ratings
      FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'weekly_ratings'
      AND policyname = 'Anyone can update weekly ratings'
  ) THEN
    CREATE POLICY "Anyone can update weekly ratings" ON weekly_ratings
      FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
