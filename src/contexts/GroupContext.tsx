import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

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

interface GroupContextType {
  groups: GroupMembership[];
  currentGroup: Group | null;
  isLoading: boolean;
  setCurrentGroup: (group: Group | null) => void;
  refreshGroups: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const useGroupContext = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error("useGroupContext must be used within a GroupProvider");
  }
  return context;
};

export const GroupProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupMembership[]>([]);
  const [currentGroup, setCurrentGroupState] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = async () => {
    if (!user) {
      setGroups([]);
      setCurrentGroupState(null);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
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

      if (groupsError) throw groupsError;

      const memberships = (groupsData || []).map(item => ({
        ...item,
        group: item.group as unknown as Group
      })) as GroupMembership[];

      setGroups(memberships);

      // Fetch user's active group preference
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_group_id')
        .eq('user_id', user.id)
        .single();

      // Set current group based on preference or default to first
      if (profile?.active_group_id) {
        const activeGroup = memberships.find(m => m.group.id === profile.active_group_id)?.group;
        setCurrentGroupState(activeGroup || memberships[0]?.group || null);
      } else {
        setCurrentGroupState(memberships[0]?.group || null);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentGroup = async (group: Group | null) => {
    setCurrentGroupState(group);
    
    // Persist the selection
    if (user && group) {
      await supabase
        .from('profiles')
        .update({ active_group_id: group.id })
        .eq('user_id', user.id);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  return (
    <GroupContext.Provider value={{ 
      groups, 
      currentGroup, 
      isLoading, 
      setCurrentGroup,
      refreshGroups: fetchGroups 
    }}>
      {children}
    </GroupContext.Provider>
  );
};
