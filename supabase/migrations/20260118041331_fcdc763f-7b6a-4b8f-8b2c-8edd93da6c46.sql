-- Add season and Glicko rating columns to games table
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS season integer NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS rd_after numeric(10,2) DEFAULT 350,
ADD COLUMN IF NOT EXISTS volatility_after numeric(10,6) DEFAULT 0.06,
ADD COLUMN IF NOT EXISTS victory_type text DEFAULT 'standard';

-- Create index for season filtering
CREATE INDEX IF NOT EXISTS idx_games_season ON public.games(season);

-- Update existing games to set season based on date
UPDATE public.games 
SET season = CASE 
  WHEN date LIKE '2025%' THEN 1
  WHEN date LIKE '2026%' THEN 2
  ELSE 2
END;

-- Create a table to store player season stats (for soft reset tracking)
CREATE TABLE IF NOT EXISTS public.player_season_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player text NOT NULL,
  season integer NOT NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  starting_mmr integer NOT NULL DEFAULT 2000,
  ending_mmr integer,
  starting_rd numeric(10,2) NOT NULL DEFAULT 350,
  ending_rd numeric(10,2),
  starting_volatility numeric(10,6) NOT NULL DEFAULT 0.06,
  games_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(player, season, group_id)
);

-- Enable RLS on player_season_stats
ALTER TABLE public.player_season_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for player_season_stats
CREATE POLICY "Members can view group season stats"
ON public.player_season_stats
FOR SELECT
USING (group_id IS NULL OR is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can insert group season stats"
ON public.player_season_stats
FOR INSERT
WITH CHECK (group_id IS NULL OR is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can update group season stats"
ON public.player_season_stats
FOR UPDATE
USING (group_id IS NULL OR is_group_member(auth.uid(), group_id));

-- Add realtime for player_season_stats
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_season_stats;