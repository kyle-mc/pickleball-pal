import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

// Default group that everyone is auto-joined to
const DEFAULT_GROUP_ID = "9fcbad15-4d0a-4882-9ee0-062585475a82";
const DEFAULT_GROUP_NAME = "KC Pickleballers";

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
      // Even without user, set the default group for viewing content
      setCurrentGroupState({
        id: DEFAULT_GROUP_ID,
        name: DEFAULT_GROUP_NAME,
        description: null,
        invite_code: "",
        owner_id: null,
      });
      setGroups([]);
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

      let memberships = (groupsData || []).map(item => ({
        ...item,
        group: item.group as unknown as Group
      })) as GroupMembership[];

      // Check if user is a member of the default group
      const isInDefaultGroup = memberships.some(m => m.group.id === DEFAULT_GROUP_ID);
      
      // Auto-join to default group if not already a member
      if (!isInDefaultGroup) {
        // Get user's linked player id
        const { data: profile } = await supabase
          .from('profiles')
          .select('linked_player_id')
          .eq('user_id', user.id)
          .single();

        // Join the default group
        const { data: newMembership, error: joinError } = await supabase
          .from('group_members')
          .insert({
            group_id: DEFAULT_GROUP_ID,
            user_id: user.id,
            player_id: profile?.linked_player_id || null,
          })
          .select(`
            id,
            group_id,
            user_id,
            player_id,
            joined_at,
            group:groups(id, name, description, invite_code, owner_id)
          `)
          .single();

        if (!joinError && newMembership) {
          memberships = [...memberships, {
            ...newMembership,
            group: newMembership.group as unknown as Group
          }];
        }
      }

      setGroups(memberships);

      // Always set current group to default
      const defaultGroup = memberships.find(m => m.group.id === DEFAULT_GROUP_ID)?.group;
      setCurrentGroupState(defaultGroup || memberships[0]?.group || {
        id: DEFAULT_GROUP_ID,
        name: DEFAULT_GROUP_NAME,
        description: null,
        invite_code: "",
        owner_id: null,
      });
    } catch (error) {
      console.error("Error fetching groups:", error);
      // On error, still set default group
      setCurrentGroupState({
        id: DEFAULT_GROUP_ID,
        name: DEFAULT_GROUP_NAME,
        description: null,
        invite_code: "",
        owner_id: null,
      });
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
