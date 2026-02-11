-- Add reply moderation setting
ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS replies_require_approval BOOLEAN DEFAULT TRUE;

UPDATE app_settings
  SET replies_require_approval = COALESCE(replies_require_approval, TRUE)
  WHERE id = 'global';