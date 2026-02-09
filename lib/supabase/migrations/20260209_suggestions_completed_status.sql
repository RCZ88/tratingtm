-- Allow completed status on suggestions
ALTER TABLE suggestions
  DROP CONSTRAINT IF EXISTS suggestions_status_check;

ALTER TABLE suggestions
  ADD CONSTRAINT suggestions_status_check
  CHECK (status IN ('new', 'working', 'approved', 'declined', 'completed'));
