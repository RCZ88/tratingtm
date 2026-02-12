-- Emoji-based comment reactions catalog and compatibility migration

CREATE TABLE IF NOT EXISTS comment_reaction_emojis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emoji TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (emoji)
);

INSERT INTO comment_reaction_emojis (emoji, sort_order)
VALUES
  ('??', 10),
  ('??', 20),
  ('??', 30),
  ('??', 40),
  ('??', 50),
  ('??', 60),
  ('??', 70)
ON CONFLICT (emoji) DO NOTHING;

-- Migrate legacy reactions to emoji values
UPDATE comment_reactions
SET reaction = '??'
WHERE reaction = 'like';

UPDATE comment_reactions
SET reaction = '??'
WHERE reaction = 'dislike';

-- Widen reaction field and adjust uniqueness for per-emoji-per-user toggles
ALTER TABLE comment_reactions
  ALTER COLUMN reaction TYPE VARCHAR(32);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comment_reactions_reaction_check'
      AND conrelid = 'comment_reactions'::regclass
  ) THEN
    ALTER TABLE comment_reactions DROP CONSTRAINT comment_reactions_reaction_check;
  END IF;
END $$;

ALTER TABLE comment_reactions
  ADD CONSTRAINT comment_reactions_reaction_check CHECK (char_length(trim(reaction)) > 0);

DROP INDEX IF EXISTS comment_reactions_comment_id_anonymous_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comment_reactions_comment_user_reaction_unique'
      AND conrelid = 'comment_reactions'::regclass
  ) THEN
    ALTER TABLE comment_reactions
      ADD CONSTRAINT comment_reactions_comment_user_reaction_unique
      UNIQUE (comment_id, anonymous_id, reaction);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comment_reaction_emojis_enabled
  ON comment_reaction_emojis (enabled, sort_order, emoji);

ALTER TABLE comment_reaction_emojis ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'comment_reaction_emojis'
      AND policyname = 'Public can view enabled reaction emojis'
  ) THEN
    CREATE POLICY "Public can view enabled reaction emojis"
      ON comment_reaction_emojis
      FOR SELECT
      USING (enabled = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'comment_reaction_emojis'
      AND policyname = 'Admin full access on comment reaction emojis'
  ) THEN
    CREATE POLICY "Admin full access on comment reaction emojis"
      ON comment_reaction_emojis
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Keep top liked comment working with migrated emoji reactions
CREATE OR REPLACE VIEW comment_like_counts AS
SELECT
  comment_id,
  COUNT(*) FILTER (WHERE reaction IN ('??', 'like')) AS like_count
FROM comment_reactions
GROUP BY comment_id;

CREATE OR REPLACE VIEW top_liked_comment AS
SELECT
  c.id,
  c.comment_text,
  c.teacher_id,
  t.name AS teacher_name,
  COALESCE(cl.like_count, 0) AS like_count,
  c.created_at
FROM comments c
JOIN teachers t ON t.id = c.teacher_id
LEFT JOIN comment_like_counts cl ON cl.comment_id = c.id
WHERE c.is_approved = true
  AND c.is_flagged = false
  AND t.is_active = true
ORDER BY COALESCE(cl.like_count, 0) DESC, c.created_at DESC
LIMIT 1;
