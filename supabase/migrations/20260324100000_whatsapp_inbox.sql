-- ══════════════════════════════════════════════
--  WhatsApp Inbox: wa_conversations + wa_messages
-- ══════════════════════════════════════════════

-- ── Conversations ────────────────────────────
CREATE TABLE IF NOT EXISTS public.wa_conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_contact_id    TEXT NOT NULL,          -- phone in E.164 (ej: 56912345678)
  contact_phone    TEXT,
  contact_name     TEXT,
  profile_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','waiting','resolved')),
  last_message_at  TIMESTAMPTZ DEFAULT NOW(),
  last_message_txt TEXT,
  unread_count     INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (wa_contact_id)
);

CREATE INDEX IF NOT EXISTS idx_wa_conv_contact  ON public.wa_conversations(wa_contact_id);
CREATE INDEX IF NOT EXISTS idx_wa_conv_status   ON public.wa_conversations(status);
CREATE INDEX IF NOT EXISTS idx_wa_conv_last_msg ON public.wa_conversations(last_message_at DESC);

ALTER TABLE public.wa_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_can_read_conversations"
  ON public.wa_conversations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "service_role_all_conversations"
  ON public.wa_conversations FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "staff_can_update_conversations"
  ON public.wa_conversations FOR UPDATE
  TO authenticated
  USING (true);

-- ── Messages ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wa_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES public.wa_conversations(id) ON DELETE CASCADE,
  wa_message_id    TEXT UNIQUE,            -- ID de Meta (para dedup)
  direction        TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  message_type     TEXT NOT NULL DEFAULT 'text',
  content          JSONB NOT NULL DEFAULT '{}',
  is_bot           BOOLEAN NOT NULL DEFAULT FALSE,
  sent_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_msg_conv ON public.wa_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_wa_msg_wa_id ON public.wa_messages(wa_message_id);

ALTER TABLE public.wa_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_can_read_messages"
  ON public.wa_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "service_role_all_messages"
  ON public.wa_messages FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- ── Helper RPC: upsert conversation ──────────
CREATE OR REPLACE FUNCTION public.upsert_wa_conversation(
  p_wa_contact_id  TEXT,
  p_contact_phone  TEXT,
  p_contact_name   TEXT,
  p_profile_id     UUID,
  p_last_message   TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_conv_id UUID;
BEGIN
  INSERT INTO public.wa_conversations
    (wa_contact_id, contact_phone, contact_name, profile_id, last_message_at, last_message_txt, unread_count)
  VALUES
    (p_wa_contact_id, p_contact_phone, p_contact_name, p_profile_id, NOW(), p_last_message, 1)
  ON CONFLICT (wa_contact_id) DO UPDATE SET
    last_message_at  = NOW(),
    last_message_txt = p_last_message,
    unread_count     = wa_conversations.unread_count + 1,
    contact_name     = COALESCE(p_contact_name, wa_conversations.contact_name),
    profile_id       = COALESCE(p_profile_id, wa_conversations.profile_id),
    status           = CASE WHEN wa_conversations.status = 'resolved' THEN 'open' ELSE wa_conversations.status END
  RETURNING id INTO v_conv_id;
  RETURN v_conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_wa_conversation TO service_role;
