import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlayerRecord {
  id: string;
  name: string;
  last_name: string | null;
}

// Fetch all players from database (Supabase is now the exclusive source)
export const usePlayers = () => {
  return useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("name")
        .order("name");
      
      if (error) throw error;
      
      return (data || []).map(p => p.name);
    },
  });
};

// Full player records (id, name, last_name) for admin & display lookups
export const usePlayersWithDetails = () => {
  return useQuery({
    queryKey: ["players-detailed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, last_name")
        .order("name");
      if (error) throw error;
      return (data || []) as PlayerRecord[];
    },
  });
};

// Lookup map: name -> last_name
export const usePlayerLastNameMap = () => {
  const { data } = usePlayersWithDetails();
  const map: Record<string, string | null> = {};
  (data || []).forEach(p => { map[p.name] = p.last_name; });
  return map;
};

// Update a player's last_name (admin only via RLS)
export const useUpdatePlayerLastName = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, last_name }: { id: string; last_name: string | null }) => {
      const { error } = await supabase
        .from("players")
        .update({ last_name: last_name?.trim() || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players-detailed"] });
      qc.invalidateQueries({ queryKey: ["players"] });
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
