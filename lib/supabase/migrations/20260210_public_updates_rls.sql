-- Relax public_updates RLS to allow changelog reads
ALTER TABLE public_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active updates" ON public_updates;
CREATE POLICY "Public can read active updates" ON public_updates
  FOR SELECT USING (is_active = TRUE);