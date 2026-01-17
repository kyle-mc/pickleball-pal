import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  owner_id: string | null;
}

export interface GroupMembership {
  id: string;
  group_id: string;
  user_id: string;
  player_id: string | null;
  joined_at: string;
  group: Group;
}

export const useGroups = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['groups', user?.id],
    queryFn: async (): Promise<GroupMembership[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          group_id,
          user_id,
          player_id,
          joined_at,
          group:groups(id, name, description, invite_code, owner_id)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        group: item.group as unknown as Group
      }));
    },
    enabled: !!user,
  });
};

export const useCurrentGroup = () => {
  const { data: groups = [], isLoading } = useGroups();
  
  // For now, use the first group as current
  // TODO: Add group switching functionality
  const currentGroup = groups[0]?.group || null;

  return {
    currentGroup,
    groups,
    isLoading,
  };
};
