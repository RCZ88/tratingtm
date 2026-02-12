-- Rename suggestions status from "working" to "on_hold"
UPDATE suggestions
SET status = 'on_hold'
WHERE status = 'working';

ALTER TABLE suggestions
  DROP CONSTRAINT IF EXISTS suggestions_status_check;

ALTER TABLE suggestions
  ADD CONSTRAINT suggestions_status_check
  CHECK (status IN ('new', 'on_hold', 'approved', 'declined', 'completed'));
