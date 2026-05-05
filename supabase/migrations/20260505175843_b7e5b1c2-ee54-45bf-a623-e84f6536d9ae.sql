
-- 1. Add length constraint to video_comments
ALTER TABLE public.video_comments
  ADD CONSTRAINT video_comments_content_length CHECK (char_length(content) <= 1000) NOT VALID;

-- 5. Fix always-true RLS on video_comments (DELETE/UPDATE) — restrict to authenticated owners
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.video_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.video_comments;

CREATE POLICY "Users can delete their own comments"
ON public.video_comments
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
ON public.video_comments
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 2. Harden update_player_season_stats: only callable by service_role (edge function context)
CREATE OR REPLACE FUNCTION public.update_player_season_stats(p_player text, p_season integer, p_group_id uuid, p_ending_mmr integer, p_ending_rd numeric, p_is_win boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Restrict direct invocation: only service role (used by trusted edge functions) may call this.
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'update_player_season_stats can only be invoked by service role';
  END IF;

  INSERT INTO public.player_season_stats (
    player, season, group_id, starting_mmr, ending_mmr, ending_rd, games_played, wins, losses
  )
  VALUES (
    p_player, p_season, p_group_id, p_ending_mmr, p_ending_mmr, p_ending_rd, 1,
    CASE WHEN p_is_win THEN 1 ELSE 0 END,
    CASE WHEN p_is_win THEN 0 ELSE 1 END
  )
  ON CONFLICT (player, season, group_id)
  DO UPDATE SET
    ending_mmr = p_ending_mmr,
    ending_rd = p_ending_rd,
    games_played = player_season_stats.games_played + 1,
    wins = player_season_stats.wins + CASE WHEN p_is_win THEN 1 ELSE 0 END,
    losses = player_season_stats.losses + CASE WHEN p_is_win THEN 0 ELSE 1 END,
    updated_at = now();
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.update_player_season_stats(text, integer, uuid, integer, numeric, boolean) FROM PUBLIC, anon, authenticated;
