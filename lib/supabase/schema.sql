-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (admin only)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  color_hex VARCHAR(16) NOT NULL DEFAULT '#16a34a',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_departments_name ON departments(name);

-- Subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department_id, name)
);

CREATE INDEX idx_subjects_department ON subjects(department_id);
CREATE INDEX idx_subjects_name ON subjects(name);

-- Teachers table
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  levels TEXT[] DEFAULT '{}',
  year_levels INT[] DEFAULT '{}',
  bio TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_teachers_active ON teachers(is_active);
CREATE INDEX idx_teachers_name ON teachers(name);
CREATE INDEX idx_teachers_department ON teachers(department_id);

-- Teacher subjects join table
CREATE TABLE teacher_subjects (
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (teacher_id, subject_id)
);

CREATE INDEX idx_teacher_subjects_teacher ON teacher_subjects(teacher_id);
CREATE INDEX idx_teacher_subjects_subject ON teacher_subjects(subject_id);

-- Ratings table
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  anonymous_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ratings_teacher ON ratings(teacher_id);
CREATE INDEX idx_ratings_created_at ON ratings(created_at);

-- Weekly unique ratings table
CREATE TABLE weekly_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  anonymous_id VARCHAR(255) NOT NULL,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  week_start DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, anonymous_id, week_start)
);

CREATE INDEX idx_weekly_ratings_teacher_week ON weekly_ratings(teacher_id, week_start);
CREATE INDEX idx_weekly_ratings_week ON weekly_ratings(week_start);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  anonymous_id VARCHAR(255) NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_teacher ON comments(teacher_id);
CREATE INDEX idx_comments_approved ON comments(is_approved);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Comment reactions table
CREATE TABLE comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  anonymous_id VARCHAR(255) NOT NULL,
  reaction VARCHAR(10) NOT NULL CHECK (reaction IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, anonymous_id)
);

CREATE INDEX idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_reaction ON comment_reactions(reaction);

-- Banned words table
CREATE TABLE banned_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_banned_words_word ON banned_words((lower(word)));
CREATE INDEX idx_banned_words_enabled ON banned_words(enabled);

-- Suggestions table
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('general', 'teacher_add', 'teacher_modify')),
  title VARCHAR(255),
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'on_hold', 'approved', 'declined', 'completed')),
  teacher_name VARCHAR(255),
  department VARCHAR(255),
  subject VARCHAR(255),
  level VARCHAR(10),
  year_level VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_suggestions_status ON suggestions(status);
CREATE INDEX idx_suggestions_type ON suggestions(type);
CREATE INDEX idx_suggestions_created_at ON suggestions(created_at);

-- Suggestion votes table
CREATE TABLE suggestion_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  anonymous_id VARCHAR(255) NOT NULL,
  vote VARCHAR(10) NOT NULL CHECK (vote IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(suggestion_id, anonymous_id)
);

CREATE INDEX idx_suggestion_votes_suggestion ON suggestion_votes(suggestion_id);
CREATE INDEX idx_suggestion_votes_vote ON suggestion_votes(vote);

-- App settings (single-row)
CREATE TABLE app_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  comments_require_approval BOOLEAN DEFAULT true,
  replies_require_approval BOOLEAN DEFAULT true,
  maintenance_enabled BOOLEAN DEFAULT false,
  maintenance_message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard cache table
CREATE TABLE leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_ratings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  total_comments INTEGER DEFAULT 0,
  rank_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, week_start)
);

CREATE INDEX idx_leaderboard_week ON leaderboard_cache(week_start, week_end);
CREATE INDEX idx_leaderboard_rank ON leaderboard_cache(rank_position);

-- Current week leaderboard view
CREATE OR REPLACE VIEW current_week_leaderboard AS
WITH rating_agg AS (
  SELECT
    r.teacher_id,
    COUNT(r.id) AS rating_count,
    ROUND(AVG(r.stars)::numeric, 2) AS average_rating
  FROM ratings r
  WHERE r.created_at >= date_trunc('week', CURRENT_DATE)
  GROUP BY r.teacher_id
),
comment_agg AS (
  SELECT
    c.teacher_id,
    COUNT(c.id) AS comment_count
  FROM comments c
  WHERE c.created_at >= date_trunc('week', CURRENT_DATE)
    AND c.is_approved = true
  GROUP BY c.teacher_id
)
SELECT
  t.id,
  t.name,
  subj.subject_name AS subject,
  d.name AS department,
  t.image_url,
  COALESCE(r.rating_count, 0) AS rating_count,
  r.average_rating,
  COALESCE(c.comment_count, 0) AS comment_count
FROM teachers t
LEFT JOIN departments d ON d.id = t.department_id
LEFT JOIN LATERAL (
  SELECT s.name AS subject_name
  FROM teacher_subjects ts
  JOIN subjects s ON s.id = ts.subject_id
  WHERE ts.teacher_id = t.id
  ORDER BY s.name
  LIMIT 1
) subj ON true
LEFT JOIN rating_agg r ON t.id = r.teacher_id
LEFT JOIN comment_agg c ON t.id = c.teacher_id
WHERE t.is_active = true
ORDER BY r.average_rating DESC NULLS LAST, r.rating_count DESC NULLS LAST;

-- Teacher statistics view
CREATE OR REPLACE VIEW teacher_stats AS
SELECT 
  t.id,
  t.name,
  COUNT(DISTINCT r.id) as total_ratings,
  ROUND(AVG(r.stars)::numeric, 2) as overall_rating,
  COUNT(DISTINCT c.id) as total_comments
FROM teachers t
LEFT JOIN ratings r ON t.id = r.teacher_id
LEFT JOIN comments c ON t.id = c.teacher_id AND c.is_approved = true
GROUP BY t.id, t.name;

-- Teacher popularity view
CREATE OR REPLACE VIEW teacher_popularity AS
SELECT
  t.id,
  t.name,
  subj.subject_name AS subject,
  d.name AS department,
  t.image_url,
  s.total_ratings,
  s.total_comments,
  (s.total_ratings + s.total_comments) AS total_interactions
FROM teachers t
LEFT JOIN departments d ON d.id = t.department_id
LEFT JOIN LATERAL (
  SELECT s.name AS subject_name
  FROM teacher_subjects ts
  JOIN subjects s ON s.id = ts.subject_id
  WHERE ts.teacher_id = t.id
  ORDER BY s.name
  LIMIT 1
) subj ON true
JOIN teacher_stats s ON s.id = t.id
WHERE t.is_active = true;

-- Rating summary view
CREATE OR REPLACE VIEW rating_summary AS
SELECT
  COUNT(*) AS total_ratings,
  ROUND(AVG(stars)::numeric, 2) AS average_rating
FROM ratings;

-- Comment like counts view
CREATE OR REPLACE VIEW comment_like_counts AS
SELECT
  comment_id,
  COUNT(*) FILTER (WHERE reaction = 'like') AS like_count
FROM comment_reactions
GROUP BY comment_id;

-- Top liked comment view
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

-- Function to update weekly leaderboard
CREATE OR REPLACE FUNCTION update_weekly_leaderboard()
RETURNS void AS $$
DECLARE
  week_start_val DATE;
  week_end_val DATE;
BEGIN
  week_start_val := date_trunc('week', CURRENT_DATE)::DATE;
  week_end_val := (week_start_val + INTERVAL '6 days')::DATE;
  
  DELETE FROM leaderboard_cache WHERE week_start = week_start_val;
  
  INSERT INTO leaderboard_cache (teacher_id, week_start, week_end, total_ratings, average_rating, total_comments, rank_position)
  WITH rating_agg AS (
    SELECT
      r.teacher_id,
      COUNT(r.id) AS total_ratings,
      ROUND(AVG(r.stars)::numeric, 2) AS average_rating
    FROM ratings r
    WHERE r.created_at >= week_start_val
      AND r.created_at < (week_end_val + INTERVAL '1 day')
    GROUP BY r.teacher_id
  ),
  comment_agg AS (
    SELECT
      c.teacher_id,
      COUNT(c.id) AS total_comments
    FROM comments c
    WHERE c.created_at >= week_start_val
      AND c.created_at < (week_end_val + INTERVAL '1 day')
      AND c.is_approved = true
    GROUP BY c.teacher_id
  )
  SELECT
    t.id,
    week_start_val,
    week_end_val,
    COALESCE(r.total_ratings, 0) AS total_ratings,
    r.average_rating,
    COALESCE(c.total_comments, 0) AS total_comments,
    ROW_NUMBER() OVER (
      ORDER BY r.average_rating DESC NULLS LAST, r.total_ratings DESC NULLS LAST
    ) AS rank_position
  FROM teachers t
  LEFT JOIN rating_agg r ON t.id = r.teacher_id
  LEFT JOIN comment_agg c ON t.id = c.teacher_id
  WHERE t.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- Public policies
CREATE POLICY "Public can view active teachers" ON teachers
  FOR SELECT USING (is_active = true);

-- Department policies
CREATE POLICY "Public can view departments" ON departments
  FOR SELECT USING (true);

CREATE POLICY "Admin full access on departments" ON departments
  FOR ALL USING (auth.role() = 'service_role');

-- Subject policies
CREATE POLICY "Public can view subjects" ON subjects
  FOR SELECT USING (true);

CREATE POLICY "Admin full access on subjects" ON subjects
  FOR ALL USING (auth.role() = 'service_role');

-- Teacher subject policies
CREATE POLICY "Public can view teacher subjects" ON teacher_subjects
  FOR SELECT USING (true);

CREATE POLICY "Admin full access on teacher subjects" ON teacher_subjects
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public can view approved comments" ON comments
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Public can view ratings" ON ratings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can submit ratings" ON ratings
  FOR INSERT WITH CHECK (true);

-- Weekly ratings policies
CREATE POLICY "Public can view weekly ratings" ON weekly_ratings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can submit weekly ratings" ON weekly_ratings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update weekly ratings" ON weekly_ratings
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can submit comments" ON comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view leaderboard" ON leaderboard_cache
  FOR SELECT USING (true);

-- Comment reaction policies
CREATE POLICY "Public can view comment reactions" ON comment_reactions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can react to comments" ON comment_reactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update comment reactions" ON comment_reactions
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete comment reactions" ON comment_reactions
  FOR DELETE USING (true);

-- Banned words policies
CREATE POLICY "Public can view banned words" ON banned_words
  FOR SELECT USING (enabled = true);

CREATE POLICY "Admin full access on banned words" ON banned_words
  FOR ALL USING (auth.role() = 'service_role');

-- Suggestion policies
CREATE POLICY "Public can view suggestions" ON suggestions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can submit suggestions" ON suggestions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin full access on suggestions" ON suggestions
  FOR ALL USING (auth.role() = 'service_role');

-- Suggestion votes policies
CREATE POLICY "Public can view suggestion votes" ON suggestion_votes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can vote on suggestions" ON suggestion_votes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update suggestion votes" ON suggestion_votes
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete suggestion votes" ON suggestion_votes
  FOR DELETE USING (true);

-- App settings policies
CREATE POLICY "Public can view app settings" ON app_settings
  FOR SELECT USING (true);

CREATE POLICY "Admin full access on app_settings" ON app_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Admin policies (requires service role or authenticated admin)
CREATE POLICY "Admin full access on teachers" ON teachers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin full access on comments" ON comments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin full access on users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin full access on leaderboard_cache" ON leaderboard_cache
  FOR ALL USING (auth.role() = 'service_role');


