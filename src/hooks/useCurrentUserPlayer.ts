import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserPlayerData {
  displayName: string | null;
  linkedPlayerName: string | null;
  profileComplete: boolean;
  avatarUrl: string | null;
}

export const useCurrentUserPlayer = () => {
  const { user } = useAuth();

  return useQuery<UserPlayerData | null>({
    queryKey: ['current-user-player', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          display_name,
          linked_player_id,
          profile_complete,
          avatar_url
        `)
        .eq('user_id', user.id)
        .single();

      if (error || !profile) return null;

      // If there's a linked player, get the player name
      let linkedPlayerName: string | null = null;
      if (profile.linked_player_id) {
        const { data: player } = await supabase
          .from('players')
          .select('name')
          .eq('id', profile.linked_player_id)
          .single();
        
        linkedPlayerName = player?.name || null;
      }

      return {
        displayName: profile.display_name,
        linkedPlayerName,
        profileComplete: profile.profile_complete || false,
        avatarUrl: profile.avatar_url,
      };
    },
    enabled: !!user,
  });
};
