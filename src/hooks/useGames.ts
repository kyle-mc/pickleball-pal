import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GameRecord {
  game: number;
  result: 'Winner' | 'Loser';
  player: string;
  score: string;
  mmrBefore: number;
  teamMmr: number;
  teamMmrDiff: number;
  mmrAfter: number;
  mmrChange: number;
  date: string;
  eventId?: string;
  season?: number;
  rdAfter?: number;
  volatilityAfter?: number;
  victoryType?: string;
}

// Fetch all games from database with optional season filter
export const useGames = (season?: number | "all") => {
  return useQuery({
    queryKey: ["games", season],
    queryFn: async () => {
      let query = supabase
        .from("games")
        .select("*")
        .order("date", { ascending: false })
        .order("game_number", { ascending: true });
      
      if (season && season !== "all") {
        query = query.eq("season", season);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const dbGames: GameRecord[] = (data || []).map(g => ({
        game: g.game_number,
        result: g.result as 'Winner' | 'Loser',
        player: g.player,
        score: g.score || '',
        mmrBefore: g.mmr_before,
        teamMmr: g.team_mmr,
        teamMmrDiff: g.team_mmr_diff,
        mmrAfter: g.mmr_after,
        mmrChange: g.mmr_change,
        date: g.date,
        eventId: g.event_id || undefined,
        season: g.season,
        rdAfter: g.rd_after ? Number(g.rd_after) : undefined,
        volatilityAfter: g.volatility_after ? Number(g.volatility_after) : undefined,
        victoryType: g.victory_type || undefined,
      }));
      
      return dbGames;
    },
  });
};

// Get the next game number for a given date
export const useNextGameNumber = (date: string, allGames: GameRecord[]) => {
  const gamesOnDate = allGames.filter(g => g.date === date);
  if (gamesOnDate.length === 0) return 1;
  return Math.max(...gamesOnDate.map(g => g.game)) + 1;
};

// Submit game via edge function (server-side MMR calculation)
export const useSubmitGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (gameData: {
      winningPlayers: string[];
      losingPlayers: string[];
      winningScore: number;
      losingScore: number;
      date: string;
      groupId?: string;
      eventId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('calculate-mmr', {
        body: gameData,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });
};

// Legacy: Add games directly (for migrations)
export const useAddGames = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (games: GameRecord[]) => {
      const dbGames = games.map(g => ({
        game_number: g.game,
        date: g.date,
        player: g.player,
        result: g.result,
        score: g.score,
        mmr_before: g.mmrBefore,
        team_mmr: g.teamMmr,
        team_mmr_diff: g.teamMmrDiff,
        mmr_after: g.mmrAfter,
        mmr_change: g.mmrChange,
        event_id: g.eventId || null,
        season: g.season || 1,
      }));
      
      const { error } = await supabase.from("games").insert(dbGames);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });
};

// Get player's current MMR from all games
export const getPlayerMMR = (player: string, allGames: GameRecord[]): number => {
  const playerGames = allGames
    .filter(g => g.player === player)
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.game - a.game;
    });
  return playerGames[0]?.mmrAfter || 2000;
};

// Get player's games count for current season
export const getPlayerSeasonGamesCount = (player: string, allGames: GameRecord[], season: number): number => {
  return allGames.filter(g => g.player === player && g.season === season).length;
};
