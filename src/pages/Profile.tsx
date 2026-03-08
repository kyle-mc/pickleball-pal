import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, User, MapPin, Award, Link as LinkIcon, 
  Plus, X, Trophy, Calendar, Users, Shield
} from "lucide-react";
import { AvatarUpload } from "@/components/AvatarUpload";
import { MobileBottomNav } from "@/components/MobileBottomNav";

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  typical_play_location: string | null;
  handedness: 'left' | 'right' | 'ambidextrous' | null;
  paddles: string[] | null;
  birth_year: number | null;
  years_experience: number | null;
  dupr_profile_url: string | null;
  dupr_rating: number | null;
  groupme_url: string | null;
  discord_username: string | null;
  awards: string[] | null;
  bio: string | null;
}

interface GroupMembership {
  id: string;
  group: {
    id: string;
    name: string;
    invite_code: string;
  };
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [groups, setGroups] = useState<GroupMembership[]>([]);
  const [newPaddle, setNewPaddle] = useState("");
  const [newAward, setNewAward] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const [profileResult, groupsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('group_members')
          .select(`
            id,
            group:groups(id, name, invite_code)
          `)
          .eq('user_id', user.id)
      ]);

      if (profileResult.data) {
        setProfile(profileResult.data as ProfileData);
      }

      if (groupsResult.data) {
        setGroups(groupsResult.data as unknown as GroupMembership[]);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          city: profile.city,
          state: profile.state,
          typical_play_location: profile.typical_play_location,
          handedness: profile.handedness,
          paddles: profile.paddles,
          birth_year: profile.birth_year,
          years_experience: profile.years_experience,
          dupr_profile_url: profile.dupr_profile_url,
          dupr_rating: profile.dupr_rating,
          groupme_url: profile.groupme_url,
          discord_username: profile.discord_username,
          awards: profile.awards,
          bio: profile.bio,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile saved!",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addPaddle = () => {
    if (!newPaddle.trim() || !profile) return;
    setProfile({
      ...profile,
      paddles: [...(profile.paddles || []), newPaddle.trim()]
    });
    setNewPaddle("");
  };

  const removePaddle = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      paddles: (profile.paddles || []).filter((_, i) => i !== index)
    });
  };

  const addAward = () => {
    if (!newAward.trim() || !profile) return;
    setProfile({
      ...profile,
      awards: [...(profile.awards || []), newAward.trim()]
    });
    setNewAward("");
  };

  const removeAward = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      awards: (profile.awards || []).filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <div className="pt-24 pb-24 md:pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-4xl md:text-5xl text-foreground">My Profile</h1>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Profile Picture</Label>
                    <AvatarUpload
                      avatarUrl={profile.avatar_url}
                      displayName={profile.display_name}
                      onUploadComplete={(url) => setProfile({ ...profile, avatar_url: url })}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Display Name</Label>
                      <Input
                        value={profile.display_name || ""}
                        onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                        className="bg-muted/50 border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={user?.email || ""}
                        disabled
                        className="bg-muted/30 border-border text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    value={profile.bio || ""}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell others about yourself..."
                    className="bg-muted/50 border-border resize-none"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={profile.city || ""}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      placeholder="Your city"
                      className="bg-muted/50 border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select
                      value={profile.state || ""}
                      onValueChange={(value) => setProfile({ ...profile, state: value })}
                    >
                      <SelectTrigger className="bg-muted/50 border-border">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Where do you typically play?</Label>
                  <Input
                    value={profile.typical_play_location || ""}
                    onChange={(e) => setProfile({ ...profile, typical_play_location: e.target.value })}
                    placeholder="e.g., Central Park Courts, Local YMCA"
                    className="bg-muted/50 border-border"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Playing Style */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Playing Style
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Handedness</Label>
                    <Select
                      value={profile.handedness || ""}
                      onValueChange={(value) => setProfile({ ...profile, handedness: value as ProfileData['handedness'] })}
                    >
                      <SelectTrigger className="bg-muted/50 border-border">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right">Right-handed</SelectItem>
                        <SelectItem value="left">Left-handed</SelectItem>
                        <SelectItem value="ambidextrous">Ambidextrous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Birth Year</Label>
                    <Input
                      type="number"
                      value={profile.birth_year || ""}
                      onChange={(e) => setProfile({ ...profile, birth_year: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="1990"
                      min={1920}
                      max={new Date().getFullYear()}
                      className="bg-muted/50 border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Years Experience</Label>
                    <Input
                      type="number"
                      value={profile.years_experience || ""}
                      onChange={(e) => setProfile({ ...profile, years_experience: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="2"
                      min={0}
                      max={50}
                      className="bg-muted/50 border-border"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Paddles</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(profile.paddles || []).map((paddle, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {paddle}
                        <button onClick={() => removePaddle(i)} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newPaddle}
                      onChange={(e) => setNewPaddle(e.target.value)}
                      placeholder="Add a paddle..."
                      className="bg-muted/50 border-border"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPaddle())}
                    />
                    <Button type="button" variant="outline" onClick={addPaddle}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ratings & Social */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-primary" />
                  Ratings & Social Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>DUPR Profile URL</Label>
                    <Input
                      value={profile.dupr_profile_url || ""}
                      onChange={(e) => setProfile({ ...profile, dupr_profile_url: e.target.value })}
                      placeholder="https://mydupr.com/profile/..."
                      className="bg-muted/50 border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>DUPR Rating</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={profile.dupr_rating || ""}
                      onChange={(e) => setProfile({ ...profile, dupr_rating: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="4.250"
                      min={0}
                      max={8}
                      className="bg-muted/50 border-border"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>GroupMe</Label>
                    <Input
                      value={profile.groupme_url || ""}
                      onChange={(e) => setProfile({ ...profile, groupme_url: e.target.value })}
                      placeholder="GroupMe profile URL"
                      className="bg-muted/50 border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discord Username</Label>
                    <Input
                      value={profile.discord_username || ""}
                      onChange={(e) => setProfile({ ...profile, discord_username: e.target.value })}
                      placeholder="username#1234"
                      className="bg-muted/50 border-border"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Awards */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Awards & Trophies
                </CardTitle>
                <CardDescription>
                  Tournament wins, achievements, and other accolades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(profile.awards || []).map((award, i) => (
                    <Badge key={i} variant="outline" className="gap-1 bg-accent/10 border-accent/30">
                      <Trophy className="w-3 h-3" />
                      {award}
                      <button onClick={() => removeAward(i)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newAward}
                    onChange={(e) => setNewAward(e.target.value)}
                    placeholder="Add an award..."
                    className="bg-muted/50 border-border"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAward())}
                  />
                  <Button type="button" variant="outline" onClick={addAward}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Admin Settings */}
            {isAdmin && (
              <Card className="bg-card/50 border-border border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Admin Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Placement System</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        When enabled, players with fewer than 10 games will have their MMR hidden until they complete placement.
                      </p>
                    </div>
                    <Switch
                      checked={localPlacementEnabled}
                      onCheckedChange={handleTogglePlacement}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Groups */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  My Groups
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groups.length === 0 ? (
                  <p className="text-muted-foreground">You're not a member of any groups yet.</p>
                ) : (
                  <div className="space-y-3">
                    {groups.map((membership) => (
                      <div key={membership.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                        <div>
                          <p className="font-medium text-foreground">{membership.group.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Invite code: <code className="bg-muted px-1 rounded">{membership.group.invite_code}</code>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
      <MobileBottomNav />
    </main>
  );
};

export default Profile;
