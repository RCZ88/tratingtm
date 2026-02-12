-- Add maintenance mode settings
ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS replies_require_approval BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS maintenance_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS maintenance_message TEXT;

UPDATE app_settings
SET replies_require_approval = COALESCE(replies_require_approval, true),
    maintenance_enabled = COALESCE(maintenance_enabled, false)
WHERE id = 'global';
