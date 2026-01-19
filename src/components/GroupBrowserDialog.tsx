import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupContext } from "@/contexts/GroupContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, UserPlus, Plus } from "lucide-react";

interface GroupBrowserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GroupBrowserDialog = ({ open, onOpenChange }: GroupBrowserDialogProps) => {
  const { user } = useAuth();
  const { refreshGroups } = useGroupContext();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("join");
  
  // Join group state
  const [inviteCode, setInviteCode] = useState("");
  
  // Create group state
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteCode.trim()) return;

    setLoading(true);

    try {
      // Find group by invite code
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('invite_code', inviteCode.trim().toLowerCase())
        .single();

      if (groupError || !group) {
        toast({
          title: "Invalid invite code",
          description: "No group found with that invite code.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        toast({
          title: "Already a member",
          description: `You're already a member of ${group.name}!`,
        });
        onOpenChange(false);
        return;
      }

      // Get user's linked player id
      const { data: profile } = await supabase
        .from('profiles')
        .select('linked_player_id')
        .eq('user_id', user.id)
        .single();

      // Join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          player_id: profile?.linked_player_id || null,
        });

      if (joinError) throw joinError;

      toast({
        title: "Joined!",
        description: `You've joined ${group.name}.`,
      });

      await refreshGroups();
      setInviteCode("");
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join group",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupName.trim()) return;

    setLoading(true);

    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName.trim(),
          description: groupDescription.trim() || null,
          owner_id: user.id,
        })
        .select('id, invite_code')
        .single();

      if (groupError) throw groupError;

      // Get user's linked player id
      const { data: profile } = await supabase
        .from('profiles')
        .select('linked_player_id')
        .eq('user_id', user.id)
        .single();

      // Add creator as a member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          player_id: profile?.linked_player_id || null,
        });

      if (memberError) throw memberError;

      toast({
        title: "Group created!",
        description: `Share invite code "${group.invite_code}" with friends.`,
      });

      await refreshGroups();
      setGroupName("");
      setGroupDescription("");
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create group",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Groups</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="join" className="gap-2">
              <UserPlus className="w-4 h-4" />
              Join Group
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Group
            </TabsTrigger>
          </TabsList>

          <TabsContent value="join">
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite Code</Label>
                <Input
                  id="inviteCode"
                  placeholder="Enter 8-character code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="bg-muted/50 border-border text-center text-lg tracking-widest uppercase"
                  maxLength={8}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !inviteCode.trim()}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                Join Group
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="create">
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  placeholder="Weekend Warriors"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="bg-muted/50 border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupDescription">Description (optional)</Label>
                <Textarea
                  id="groupDescription"
                  placeholder="What's your group about?"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="bg-muted/50 border-border resize-none"
                  rows={2}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !groupName.trim()}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Group
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
