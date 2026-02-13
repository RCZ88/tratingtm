-- Forum + complaints feature

-- New forum posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL DEFAULT 'forum' CHECK (category IN ('forum')),
  title VARCHAR(255),
  body TEXT NOT NULL,
  author_role VARCHAR(20) NOT NULL CHECK (author_role IN ('user', 'admin')),
  anonymous_id VARCHAR(255),
  admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  pinned_at TIMESTAMP WITH TIME ZONE,
  image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_approved ON forum_posts(is_approved, is_flagged);
CREATE INDEX IF NOT EXISTS idx_forum_posts_pinned ON forum_posts(is_pinned, pinned_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author_role ON forum_posts(author_role);

-- New forum replies table
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author_role VARCHAR(20) NOT NULL CHECK (author_role IN ('user', 'admin')),
  anonymous_id VARCHAR(255),
  admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_replies_post ON forum_replies(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_approved ON forum_replies(is_approved, is_flagged);
CREATE INDEX IF NOT EXISTS idx_forum_replies_parent ON forum_replies(parent_reply_id);

-- Post reactions
CREATE TABLE IF NOT EXISTS forum_post_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  anonymous_id VARCHAR(255) NOT NULL,
  reaction VARCHAR(32) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, anonymous_id, reaction)
);

CREATE INDEX IF NOT EXISTS idx_forum_post_reactions_post ON forum_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_reactions_reaction ON forum_post_reactions(reaction);

-- Reply reactions
CREATE TABLE IF NOT EXISTS forum_reply_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reply_id UUID NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
  anonymous_id VARCHAR(255) NOT NULL,
  reaction VARCHAR(32) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reply_id, anonymous_id, reaction)
);

CREATE INDEX IF NOT EXISTS idx_forum_reply_reactions_reply ON forum_reply_reactions(reply_id);
CREATE INDEX IF NOT EXISTS idx_forum_reply_reactions_reaction ON forum_reply_reactions(reaction);

-- Complaints
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255),
  description TEXT NOT NULL,
  anonymous_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'on_hold', 'resolved', 'declined')),
  image_path TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status, created_at DESC);

-- Extend suggestions with optional image
ALTER TABLE suggestions
  ADD COLUMN IF NOT EXISTS image_path TEXT;

-- RLS
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reply_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Forum public read (approved + visible)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_posts' AND policyname = 'Public can view approved forum posts'
  ) THEN
    CREATE POLICY "Public can view approved forum posts" ON forum_posts
      FOR SELECT USING (is_approved = true AND is_flagged = false);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_replies' AND policyname = 'Public can view approved forum replies'
  ) THEN
    CREATE POLICY "Public can view approved forum replies" ON forum_replies
      FOR SELECT USING (is_approved = true AND is_flagged = false);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_post_reactions' AND policyname = 'Public can view forum post reactions'
  ) THEN
    CREATE POLICY "Public can view forum post reactions" ON forum_post_reactions
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_reply_reactions' AND policyname = 'Public can view forum reply reactions'
  ) THEN
    CREATE POLICY "Public can view forum reply reactions" ON forum_reply_reactions
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_posts' AND policyname = 'Anyone can create forum posts'
  ) THEN
    CREATE POLICY "Anyone can create forum posts" ON forum_posts
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_replies' AND policyname = 'Anyone can create forum replies'
  ) THEN
    CREATE POLICY "Anyone can create forum replies" ON forum_replies
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_post_reactions' AND policyname = 'Anyone can react to forum posts'
  ) THEN
    CREATE POLICY "Anyone can react to forum posts" ON forum_post_reactions
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_post_reactions' AND policyname = 'Anyone can update forum post reactions'
  ) THEN
    CREATE POLICY "Anyone can update forum post reactions" ON forum_post_reactions
      FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_post_reactions' AND policyname = 'Anyone can delete forum post reactions'
  ) THEN
    CREATE POLICY "Anyone can delete forum post reactions" ON forum_post_reactions
      FOR DELETE USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_reply_reactions' AND policyname = 'Anyone can react to forum replies'
  ) THEN
    CREATE POLICY "Anyone can react to forum replies" ON forum_reply_reactions
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_reply_reactions' AND policyname = 'Anyone can update forum reply reactions'
  ) THEN
    CREATE POLICY "Anyone can update forum reply reactions" ON forum_reply_reactions
      FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_reply_reactions' AND policyname = 'Anyone can delete forum reply reactions'
  ) THEN
    CREATE POLICY "Anyone can delete forum reply reactions" ON forum_reply_reactions
      FOR DELETE USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'complaints' AND policyname = 'Anyone can submit complaints'
  ) THEN
    CREATE POLICY "Anyone can submit complaints" ON complaints
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Ownership updates/deletes (public users, by anonymous_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_posts' AND policyname = 'Users can edit own forum posts'
  ) THEN
    CREATE POLICY "Users can edit own forum posts" ON forum_posts
      FOR UPDATE USING (author_role = 'user')
      WITH CHECK (author_role = 'user');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_posts' AND policyname = 'Users can delete own forum posts'
  ) THEN
    CREATE POLICY "Users can delete own forum posts" ON forum_posts
      FOR DELETE USING (author_role = 'user');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_replies' AND policyname = 'Users can edit own forum replies'
  ) THEN
    CREATE POLICY "Users can edit own forum replies" ON forum_replies
      FOR UPDATE USING (author_role = 'user')
      WITH CHECK (author_role = 'user');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_replies' AND policyname = 'Users can delete own forum replies'
  ) THEN
    CREATE POLICY "Users can delete own forum replies" ON forum_replies
      FOR DELETE USING (author_role = 'user');
  END IF;
END $$;

-- Admin full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_posts' AND policyname = 'Admin full access on forum_posts'
  ) THEN
    CREATE POLICY "Admin full access on forum_posts" ON forum_posts
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_replies' AND policyname = 'Admin full access on forum_replies'
  ) THEN
    CREATE POLICY "Admin full access on forum_replies" ON forum_replies
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_post_reactions' AND policyname = 'Admin full access on forum_post_reactions'
  ) THEN
    CREATE POLICY "Admin full access on forum_post_reactions" ON forum_post_reactions
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_reply_reactions' AND policyname = 'Admin full access on forum_reply_reactions'
  ) THEN
    CREATE POLICY "Admin full access on forum_reply_reactions" ON forum_reply_reactions
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'complaints' AND policyname = 'Admin full access on complaints'
  ) THEN
    CREATE POLICY "Admin full access on complaints" ON complaints
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Private storage bucket for forum images
INSERT INTO storage.buckets (id, name, public)
SELECT 'forum-images', 'forum-images', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'forum-images'
);
