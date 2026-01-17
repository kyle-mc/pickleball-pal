import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, UserCheck, UserPlus } from "lucide-react";
import logo from "@/assets/logo.png";

interface Player {
  id: string;
  name: string;
}

const ProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [existingPlayers, setExistingPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  
  const [nameChoice, setNameChoice] = useState<"claim" | "new">("new");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('id, name')
        .order('name');
      
      if (!error && data) {
        setExistingPlayers(data);
      }
      setLoadingPlayers(false);
    };

    fetchPlayers();
  }, []);

  const filteredPlayers = existingPlayers.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const displayName = nameChoice === "claim" 
      ? existingPlayers.find(p => p.id === selectedPlayerId)?.name 
      : newDisplayName.trim();

    if (!displayName) {
      toast({
        title: "Display name required",
        description: "Please enter or select a display name.",
        variant: "destructive",
      });
      return;
    }

    // Check if new name already exists in players table
    if (nameChoice === "new") {
      const existingPlayer = existingPlayers.find(
        p => p.name.toLowerCase() === displayName.toLowerCase()
      );
      if (existingPlayer) {
        toast({
          title: "Name already exists",
          description: "This name is already taken. Please claim it or choose a different name.",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Update profile with display name and linked player
      const updateData: Record<string, unknown> = {
        display_name: displayName,
        profile_complete: true,
      };

      if (nameChoice === "claim" && selectedPlayerId) {
        updateData.linked_player_id = selectedPlayerId;
      } else if (nameChoice === "new") {
        // Create new player record
        const { data: newPlayer, error: playerError } = await supabase
          .from('players')
          .insert({ name: displayName })
          .select('id')
          .single();

        if (playerError) throw playerError;
        updateData.linked_player_id = newPlayer.id;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile created!",
        description: "Welcome to PicklePlay. Let's get you into a group!",
      });

      navigate('/onboarding/group');
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create profile",
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
            Set Up Your Profile
          </CardTitle>
          <CardDescription>
            Choose your display name to get started. You can claim an existing player name to link your historical stats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <RadioGroup
              value={nameChoice}
              onValueChange={(v) => setNameChoice(v as "claim" | "new")}
              className="space-y-4"
            >
              <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <RadioGroupItem value="claim" id="claim" className="mt-1" />
                <Label htmlFor="claim" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <UserCheck className="w-4 h-4 text-primary" />
                    <span className="font-medium">Claim Existing Player</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Link your account to an existing player name and keep all historical stats
                  </p>
                </Label>
              </div>
              
              <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <RadioGroupItem value="new" id="new" className="mt-1" />
                <Label htmlFor="new" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="w-4 h-4 text-accent" />
                    <span className="font-medium">Create New Name</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Start fresh with a new unique display name
                  </p>
                </Label>
              </div>
            </RadioGroup>

            {nameChoice === "claim" && (
              <div className="space-y-3">
                <Label>Search for your player name</Label>
                <Input
                  placeholder="Type to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-muted/50 border-border"
                />
                {loadingPlayers ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredPlayers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No players found matching "{searchQuery}"
                      </p>
                    ) : (
                      filteredPlayers.map((player) => (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => setSelectedPlayerId(player.id)}
                          className={`w-full p-3 rounded-lg text-left transition-colors ${
                            selectedPlayerId === player.id
                              ? 'bg-primary/20 border border-primary'
                              : 'bg-muted/30 border border-transparent hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{player.name}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {nameChoice === "new" && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Enter your display name"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="bg-muted/50 border-border"
                  required={nameChoice === "new"}
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || (nameChoice === "claim" && !selectedPlayerId) || (nameChoice === "new" && !newDisplayName.trim())}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;
