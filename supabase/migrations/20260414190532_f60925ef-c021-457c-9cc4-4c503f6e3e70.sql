-- Add game_mode to games table
ALTER TABLE public.games ADD COLUMN game_mode text NOT NULL DEFAULT 'doubles';

-- Add game_mode to player_season_stats
ALTER TABLE public.player_season_stats ADD COLUMN game_mode text NOT NULL DEFAULT 'doubles';

-- Drop old unique constraint and add new one including game_mode
ALTER TABLE public.player_season_stats DROP CONSTRAINT IF EXISTS player_season_stats_player_season_group_id_key;
ALTER TABLE public.player_season_stats ADD CONSTRAINT player_season_stats_player_season_group_id_mode_key UNIQUE (player, season, group_id, game_mode);