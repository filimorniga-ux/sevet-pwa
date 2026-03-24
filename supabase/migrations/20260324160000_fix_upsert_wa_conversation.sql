-- Fix: recrear upsert_wa_conversation sin la columna profile_id (no existe en wa_conversations)
CREATE OR REPLACE FUNCTION public.upsert_wa_conversation(
  p_wa_contact_id text,
  p_contact_phone  text,
  p_contact_name   text,
  p_profile_id     uuid,   -- aceptado pero ignorado (compatibilidad futura)
  p_last_message   text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_conv_id UUID;
BEGIN
  INSERT INTO public.wa_conversations
    (wa_contact_id, contact_phone, contact_name, last_message_at, last_message_txt, unread_count)
  VALUES
    (p_wa_contact_id, p_contact_phone, p_contact_name, NOW(), p_last_message, 1)
  ON CONFLICT (wa_contact_id) DO UPDATE SET
    last_message_at  = NOW(),
    last_message_txt = p_last_message,
    unread_count     = wa_conversations.unread_count + 1,
    contact_name     = COALESCE(p_contact_name, wa_conversations.contact_name),
    status           = CASE WHEN wa_conversations.status = 'resolved' THEN 'open' ELSE wa_conversations.status END
  RETURNING id INTO v_conv_id;

  RETURN v_conv_id;
END;
$$;
