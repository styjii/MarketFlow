-- TABLE : notification_reads
-- Stocke les notifications lues par utilisateur (clé : user_id + order_id)
CREATE TABLE IF NOT EXISTS public.notification_reads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  order_id   UUID REFERENCES public.orders(id)   ON DELETE CASCADE NOT NULL,
  read_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, order_id)
);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own reads"
  ON public.notification_reads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reads"
  ON public.notification_reads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index pour les lookups fréquents
CREATE INDEX idx_notification_reads_user ON public.notification_reads(user_id);