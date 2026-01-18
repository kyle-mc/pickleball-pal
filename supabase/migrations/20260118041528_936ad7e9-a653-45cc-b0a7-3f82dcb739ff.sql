-- Create function to update player season stats after each game
CREATE OR REPLACE FUNCTION public.update_player_season_stats(
  p_player text,
  p_season integer,
  p_group_id uuid,
  p_ending_mmr integer,
  p_ending_rd numeric,
  p_is_win boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;