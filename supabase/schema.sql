-- Berry 🍓 Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Users table
CREATE TABLE public.users (
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

CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2. Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user1_id, user2_id),
  CHECK (user1_id <> user2_id)
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create matches"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- 3. Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  deleted_for_user_ids UUID[] DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE POLICY "Users can view messages in their matches"
  ON public.messages FOR SELECT
  TO authenticated
  USING (public.is_match_participant(auth.uid(), match_id));

CREATE POLICY "Users can send messages in their matches"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_match_participant(auth.uid(), match_id)
  );

-- 4. Now add cross-table policy (matches table exists)
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

-- 5. Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 6. Indexes for performance
CREATE INDEX idx_matches_user1 ON public.matches(user1_id);
CREATE INDEX idx_matches_user2 ON public.matches(user2_id);
CREATE INDEX idx_messages_match ON public.messages(match_id, created_at);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_matches_created ON public.matches(created_at);

-- 7. Smart matching function (SECURITY DEFINER to bypass RLS for candidate discovery)
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
  -- Count today's matches
  SELECT COUNT(*) INTO _today_count
  FROM matches m
  WHERE (m.user1_id = _user_id OR m.user2_id = _user_id)
    AND m.created_at::date = _today;

  -- Get user profile
  SELECT u.interests, u.age INTO _user_interests, _user_age
  FROM users u WHERE u.id = _user_id;

  IF _user_interests IS NULL THEN _user_interests := '{}'; END IF;

  -- Generate new matches if under limit
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

  -- Return all of today's matches
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
