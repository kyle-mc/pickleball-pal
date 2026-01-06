import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GameRecord, gamesData as staticGamesData } from "@/data/games";

// Fetch all games from database
export const useGames = () => {
  return useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("date", { ascending: false })
        .order("game_number", { ascending: true });
      
      if (error) throw error;
      
      // Convert DB format to GameRecord format
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
      }));
      
      // Combine static data with DB data
      return [...staticGamesData, ...dbGames];
    },
  });
};

// Get the next game number for a given date
export const useNextGameNumber = (date: string, allGames: GameRecord[]) => {
  const gamesOnDate = allGames.filter(g => g.date === date);
  if (gamesOnDate.length === 0) return 1;
  return Math.max(...gamesOnDate.map(g => g.game)) + 1;
};

// Add new games mutation
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
