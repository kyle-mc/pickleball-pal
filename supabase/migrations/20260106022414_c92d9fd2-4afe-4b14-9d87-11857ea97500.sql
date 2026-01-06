-- Create players table for the master list of players
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create games table for game records
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_number INTEGER NOT NULL,
  date TEXT NOT NULL,
  player TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('Winner', 'Loser')),
  score TEXT DEFAULT '',
  mmr_before INTEGER NOT NULL,
  team_mmr INTEGER NOT NULL DEFAULT 4000,
  team_mmr_diff INTEGER NOT NULL DEFAULT 0,
  mmr_after INTEGER NOT NULL,
  mmr_change INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this app)
CREATE POLICY "Anyone can view players" 
  ON public.players 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert players" 
  ON public.players 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can view games" 
  ON public.games 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert games" 
  ON public.games 
  FOR INSERT 
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_games_date ON public.games(date);
CREATE INDEX idx_games_player ON public.games(player);
CREATE INDEX idx_games_date_game ON public.games(date, game_number);