-- Berry 🍓 Database Schema (idempotent)
-- Safe to run multiple times on a fresh OR existing database.
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query).

-- ============================================================
-- 1. Users table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18),
  bio TEXT DEFAULT '',
  interests TEXT[] DEFAULT '{}',
  level INTEGER DEFAULT 1,
  response_rate FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- 2. Matches table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user1_id, user2_id),
  CHECK (user1_id <> user2_id)
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own matches" ON public.matches;
CREATE POLICY "Users can view own matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

DROP POLICY IF EXISTS "Users can create matches" ON public.matches;
CREATE POLICY "Users can create matches"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- ============================================================
-- 3. Messages table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  deleted_for_user_ids UUID[] DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Voice note columns (added later — kept inline for idempotency)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS audio_path TEXT,
  ADD COLUMN IF NOT EXISTS audio_duration NUMERIC,
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Soft-delete function: only sender can delete their own messages
CREATE OR REPLACE FUNCTION public.soft_delete_message(_message_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE messages
  SET is_deleted = TRUE, deleted_at = now(), content = ''
  WHERE id = _message_id AND sender_id = _user_id AND is_deleted = FALSE;
  RETURN FOUND;
END;
$$;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check match membership (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_match_participant(_user_id UUID, _match_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = _match_id
      AND (user1_id = _user_id OR user2_id = _user_id)
  )
$$;

DROP POLICY IF EXISTS "Users can view messages in their matches" ON public.messages;
CREATE POLICY "Users can view messages in their matches"
  ON public.messages FOR SELECT
  TO authenticated
  USING (public.is_match_participant(auth.uid(), match_id));

DROP POLICY IF EXISTS "Users can send messages in their matches" ON public.messages;
CREATE POLICY "Users can send messages in their matches"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_match_participant(auth.uid(), match_id)
  );

-- ============================================================
-- 4. Cross-table policy: view matched profiles
-- ============================================================
DROP POLICY IF EXISTS "Users can view matched profiles" ON public.users;
CREATE POLICY "Users can view matched profiles"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT CASE WHEN user1_id = auth.uid() THEN user2_id ELSE user1_id END
      FROM public.matches
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- ============================================================
-- 5. Realtime for messages (idempotent)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- ============================================================
-- 6. Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_matches_user1   ON public.matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2   ON public.matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_match  ON public.messages(match_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_matches_created ON public.matches(created_at);

-- ============================================================
-- 7. Smart matching function
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_daily_matches(_user_id UUID, _limit INT DEFAULT 5)
RETURNS TABLE (
  match_id UUID,
  partner_id UUID,
  partner_name TEXT,
  partner_age INT,
  partner_bio TEXT,
  partner_interests TEXT[],
  partner_level INT,
  partner_response_rate FLOAT,
  partner_created_at TIMESTAMPTZ,
  reason TEXT,
  match_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today DATE := CURRENT_DATE;
  _today_count INT;
  _user_interests TEXT[];
  _user_age INT;
BEGIN
  SELECT COUNT(*) INTO _today_count
  FROM matches m
  WHERE (m.user1_id = _user_id OR m.user2_id = _user_id)
    AND m.created_at::date = _today;

  SELECT u.interests, u.age INTO _user_interests, _user_age
  FROM users u WHERE u.id = _user_id;

  IF _user_interests IS NULL THEN _user_interests := '{}'; END IF;

  IF _today_count < _limit THEN
    INSERT INTO matches (user1_id, user2_id, match_reason)
    SELECT
      _user_id,
      c.id,
      CASE
        WHEN shared >= 3 THEN 'You both love ' || (
          SELECT string_agg(val, ' and ') FROM (
            SELECT unnest(ARRAY(SELECT unnest(_user_interests) INTERSECT SELECT unnest(c.interests))) AS val LIMIT 2
          ) s
        ) || ' 🍓'
        WHEN shared >= 1 THEN 'You share a passion for ' || (
          SELECT val FROM (
            SELECT unnest(ARRAY(SELECT unnest(_user_interests) INTERSECT SELECT unnest(c.interests))) AS val LIMIT 1
          ) s LIMIT 1
        ) || ' ✨'
        WHEN age_prox >= 4 THEN 'Close in age and vibes align 💫'
        ELSE 'We think you''d get along 🌸'
      END
    FROM (
      SELECT
        u.id, u.interests,
        COALESCE(array_length(ARRAY(SELECT unnest(_user_interests) INTERSECT SELECT unnest(u.interests)), 1), 0) AS shared,
        GREATEST(0, 5 - ABS(u.age - _user_age)) AS age_prox
      FROM users u
      WHERE u.id <> _user_id
        AND NOT EXISTS (
          SELECT 1 FROM matches m
          WHERE (m.user1_id = _user_id AND m.user2_id = u.id)
             OR (m.user1_id = u.id AND m.user2_id = _user_id)
        )
      ORDER BY (COALESCE(array_length(ARRAY(SELECT unnest(_user_interests) INTERSECT SELECT unnest(u.interests)), 1), 0) * 3 + GREATEST(0, 5 - ABS(u.age - _user_age)) * 2) DESC, random()
      LIMIT (_limit - _today_count)
    ) c
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    CASE WHEN m.user1_id = _user_id THEN m.user2_id ELSE m.user1_id END,
    u.name, u.age, u.bio, u.interests, u.level, u.response_rate, u.created_at,
    m.match_reason,
    m.created_at
  FROM matches m
  JOIN users u ON u.id = CASE WHEN m.user1_id = _user_id THEN m.user2_id ELSE m.user1_id END
  WHERE (m.user1_id = _user_id OR m.user2_id = _user_id)
    AND m.created_at::date = _today
  ORDER BY m.created_at DESC;
END;
$$;

-- ============================================================
-- 8. Voice Notes — private storage bucket + policies
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-audio', 'chat-audio', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Match participants can upload voice notes" ON storage.objects;
CREATE POLICY "Match participants can upload voice notes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-audio'
    AND public.is_match_participant(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "Match participants can read voice notes" ON storage.objects;
CREATE POLICY "Match participants can read voice notes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-audio'
    AND public.is_match_participant(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "Senders can delete their voice notes" ON storage.objects;
CREATE POLICY "Senders can delete their voice notes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-audio'
    AND owner = auth.uid()
  );

-- ============================================================
-- 9. Likes + Mutual Matching
-- ============================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  liked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (liker_id, liked_id),
  CHECK (liker_id <> liked_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_liker ON public.likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked ON public.likes(liked_id);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view likes involving them" ON public.likes;
CREATE POLICY "Users can view likes involving them"
  ON public.likes FOR SELECT
  TO authenticated
  USING (liker_id = auth.uid() OR liked_id = auth.uid());

DROP POLICY IF EXISTS "Users can send their own likes" ON public.likes;
CREATE POLICY "Users can send their own likes"
  ON public.likes FOR INSERT
  TO authenticated
  WITH CHECK (liker_id = auth.uid());

DROP POLICY IF EXISTS "Users can remove their own likes" ON public.likes;
CREATE POLICY "Users can remove their own likes"
  ON public.likes FOR DELETE
  TO authenticated
  USING (liker_id = auth.uid());

-- send_like RPC: inserts a like, and if reciprocal exists, creates a match.
-- Returns is_mutual + match_id (when mutual).
CREATE OR REPLACE FUNCTION public.send_like(_liker_id UUID, _liked_id UUID)
RETURNS TABLE (is_mutual BOOLEAN, match_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _reciprocal BOOLEAN;
  _existing_match UUID;
  _new_match UUID;
  _u1 UUID;
  _u2 UUID;
BEGIN
  IF _liker_id = _liked_id THEN
    RAISE EXCEPTION 'Cannot like yourself';
  END IF;

  -- Insert like (idempotent)
  INSERT INTO likes (liker_id, liked_id)
  VALUES (_liker_id, _liked_id)
  ON CONFLICT DO NOTHING;

  -- Check reciprocal like
  SELECT EXISTS (
    SELECT 1 FROM likes
    WHERE liker_id = _liked_id AND liked_id = _liker_id
  ) INTO _reciprocal;

  IF NOT _reciprocal THEN
    RETURN QUERY SELECT FALSE, NULL::UUID;
    RETURN;
  END IF;

  -- Mutual! Normalize ordering for unique constraint.
  IF _liker_id < _liked_id THEN
    _u1 := _liker_id; _u2 := _liked_id;
  ELSE
    _u1 := _liked_id; _u2 := _liker_id;
  END IF;

  SELECT id INTO _existing_match
  FROM matches
  WHERE (user1_id = _u1 AND user2_id = _u2)
     OR (user1_id = _u2 AND user2_id = _u1)
  LIMIT 1;

  IF _existing_match IS NOT NULL THEN
    RETURN QUERY SELECT TRUE, _existing_match;
    RETURN;
  END IF;

  INSERT INTO matches (user1_id, user2_id, match_reason)
  VALUES (_u1, _u2, 'You both liked each other 🍓')
  RETURNING id INTO _new_match;

  RETURN QUERY SELECT TRUE, _new_match;
END;
$$;
