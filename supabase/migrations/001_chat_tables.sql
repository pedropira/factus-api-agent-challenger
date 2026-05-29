-- Chat persistence tables for SupabaseChatStorage
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)

-- ── Conversations ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT 'Nueva conversación',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id
  ON chat_conversations (user_id);

-- ── Messages ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_number integer NOT NULL,
  role            text NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content         text NOT NULL DEFAULT '',
  tool_calls      jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_seq
  ON chat_messages (conversation_id, sequence_number);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id
  ON chat_messages (user_id);

-- ── Row-Level Security ────────────────────────────────────────────────────

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own conversations"
  ON chat_conversations FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own messages"
  ON chat_messages FOR ALL
  USING (user_id = auth.uid());
