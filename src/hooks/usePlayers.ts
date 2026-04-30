import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildDisplayNameMap } from "@/lib/playerNames";

export interface PlayerRecord {
  id: string;
  name: string;
  first_name: string | null;
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

// Full player records (id, name, first_name, last_name) for admin & display lookups
export const usePlayersWithDetails = () => {
  return useQuery({
    queryKey: ["players-detailed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, first_name, last_name")
        .order("name");
      if (error) throw error;
      return (data || []) as PlayerRecord[];
    },
  });
};

/**
 * Lookup map: players.name -> final display label (with smart disambiguation).
 * Drop-in replacement for the old `usePlayerLastNameMap`.
 */
export const usePlayerLastNameMap = () => {
  const { data } = usePlayersWithDetails();
  return buildDisplayNameMap(data || []);
};

// Update first/last name (admin only via RLS).
// Also mirrors the change to ALL profiles whose linked_player_id == this player,
// so the user's own Profile page reflects what admins set.
export const useUpdatePlayerNames = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      first_name,
      last_name,
    }: { id: string; first_name?: string | null; last_name?: string | null }) => {
      const patch: Record<string, string | null> = {};
      if (first_name !== undefined) patch.first_name = first_name?.trim() || null;
      if (last_name !== undefined) patch.last_name = last_name?.trim() || null;
      const { error } = await supabase.from("players").update(patch).eq("id", id);
      if (error) throw error;
      // Mirror to linked profiles (admins are allowed to update any profile per RLS)
      await supabase.from("profiles").update(patch).eq("linked_player_id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players-detailed"] });
      qc.invalidateQueries({ queryKey: ["players"] });
    },
  });
};

// Backwards-compat alias used by existing admin UI.
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
        if (error.code === '23505') return;
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
};
