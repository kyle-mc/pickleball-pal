import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, UserPlus, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";

const GroupOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
          description: "No group found with that invite code. Please check and try again.",
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
        navigate('/');
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
        title: "Welcome!",
        description: `You've joined ${group.name}. Let's get playing!`,
      });

      navigate('/');
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
        description: `Share invite code "${group.invite_code}" with friends to grow your group.`,
      });

      navigate('/');
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-card border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="PicklePlay" className="w-16 h-16 rounded-full" />
          </div>
          <CardTitle className="font-display text-3xl text-foreground">
            Join a Group
          </CardTitle>
          <CardDescription>
            Groups keep your stats private. Join an existing group or create your own.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="join" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Join Group
              </TabsTrigger>
              <TabsTrigger value="create" className="gap-2">
                <Users className="w-4 h-4" />
                Create Group
              </TabsTrigger>
            </TabsList>

            <TabsContent value="join">
              <form onSubmit={handleJoinGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Invite Code</Label>
                  <Input
                    id="inviteCode"
                    placeholder="Enter 8-character invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="bg-muted/50 border-border text-center text-lg tracking-widest uppercase"
                    maxLength={8}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Ask your group admin for the invite code
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !inviteCode.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Join Group
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="create">
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    placeholder="e.g., Weekend Warriors, Office League"
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
                    placeholder="Tell members what your group is about..."
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="bg-muted/50 border-border resize-none"
                    rows={3}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !groupName.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Group
                      <Users className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupOnboarding;
