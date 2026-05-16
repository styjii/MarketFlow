-- ============================================================
-- Migration : notification_reads (version 2)
-- Remplace la colonne order_id par notification_key (string)
-- pour supporter orders, reviews et likes.
-- ============================================================

-- Si vous avez déjà créé la v1, exécutez d'abord :
DROP TABLE IF EXISTS public.notification_reads;

CREATE TABLE IF NOT EXISTS public.notification_reads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Clé composite sous forme de string : "order:<id>", "review:<id>", "like:<productId>:<authorId>"
  notification_key  TEXT NOT NULL,
  read_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, notification_key)
);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own reads"
  ON public.notification_reads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reads"
  ON public.notification_reads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index pour les lookups fréquents
CREATE INDEX idx_notification_reads_user    ON public.notification_reads(user_id);
CREATE INDEX idx_notification_reads_key     ON public.notification_reads(notification_key);