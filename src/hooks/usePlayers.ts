import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { gamesData as staticGamesData } from "@/data/games";

// Fetch all players from database + static data
export const usePlayers = () => {
  return useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("name")
        .order("name");
      
      if (error) throw error;
      
      // Get players from static games data
      const staticPlayers = [...new Set(staticGamesData.map(g => g.player))];
      
      // Get players from DB
      const dbPlayers = (data || []).map(p => p.name);
      
      // Combine and deduplicate
      const allPlayers = [...new Set([...staticPlayers, ...dbPlayers])].sort();
      
      return allPlayers;
    },
  });
};

// Add a new player
export const useAddPlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("players")
        .insert({ name })
        .select()
        .single();
      
      if (error) {
        // Ignore duplicate key errors - player already exists
        if (error.code === '23505') return;
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
};
