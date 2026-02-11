-- Add comment replies table
CREATE TABLE IF NOT EXISTS comment_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  parent_reply_id UUID NULL REFERENCES comment_replies(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  anonymous_id VARCHAR(255) NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comment_replies_comment_id ON comment_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_replies_parent_id ON comment_replies(parent_reply_id);

ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'comment_replies'
      AND policyname = 'Public can read approved replies'
  ) THEN
    CREATE POLICY "Public can read approved replies" ON comment_replies
      FOR SELECT USING (is_approved = TRUE AND is_flagged = FALSE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'comment_replies'
      AND policyname = 'Anyone can submit replies'
  ) THEN
    CREATE POLICY "Anyone can submit replies" ON comment_replies
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;