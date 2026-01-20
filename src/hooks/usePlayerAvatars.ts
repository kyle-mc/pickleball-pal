import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlayerAvatarMap {
  [playerName: string]: string | null;
}

export const usePlayerAvatars = () => {
  return useQuery({
    queryKey: ["player-avatars"],
    queryFn: async () => {
      // Get profiles with linked players to map player names to avatar URLs
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          avatar_url,
          linked_player_id,
          players!profiles_linked_player_id_fkey (
            name
          )
        `)
        .not("linked_player_id", "is", null);

      if (error) throw error;

      const avatarMap: PlayerAvatarMap = {};
      
      profiles?.forEach((profile) => {
        const player = profile.players as { name: string } | null;
        if (player?.name && profile.avatar_url) {
          avatarMap[player.name] = profile.avatar_url;
        }
      });

      return avatarMap;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const getPlayerAvatar = (playerName: string, avatarMap: PlayerAvatarMap | undefined): string | null => {
  return avatarMap?.[playerName] ?? null;
};
