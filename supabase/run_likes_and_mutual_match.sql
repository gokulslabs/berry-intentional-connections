-- ============================================================
-- Berry 🍓 — Likes + Mutual Matching
-- Copy/paste this entire file into Supabase SQL Editor and Run.
-- Safe to re-run (idempotent).
-- ============================================================

-- 1. Likes table
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

-- 2. RLS
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

-- 3. send_like RPC: inserts a like; if reciprocal exists, creates a match.
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

  INSERT INTO likes (liker_id, liked_id)
  VALUES (_liker_id, _liked_id)
  ON CONFLICT DO NOTHING;

  SELECT EXISTS (
    SELECT 1 FROM likes
    WHERE liker_id = _liked_id AND liked_id = _liker_id
  ) INTO _reciprocal;

  IF NOT _reciprocal THEN
    RETURN QUERY SELECT FALSE, NULL::UUID;
    RETURN;
  END IF;

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
