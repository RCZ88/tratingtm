-- Create public_updates table for announcement banners and changelog
CREATE TABLE IF NOT EXISTS public_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_public_updates_created_at ON public_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_updates_active ON public_updates(is_active);
CREATE INDEX IF NOT EXISTS idx_public_updates_expires_at ON public_updates(expires_at);

ALTER TABLE public_updates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'public_updates'
      AND policyname = 'Public can read active updates'
  ) THEN
    CREATE POLICY "Public can read active updates" ON public_updates
      FOR SELECT
      USING (
        is_active = TRUE
        AND created_at >= (NOW() - INTERVAL '24 hours')
      );
  END IF;
END $$;

