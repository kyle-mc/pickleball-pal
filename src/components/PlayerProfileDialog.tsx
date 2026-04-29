import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { RankBadge } from "@/components/RankBadge";
import { useGames } from "@/hooks/useGames";
import { usePlayerAvatars, getPlayerAvatar } from "@/hooks/usePlayerAvatars";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Trophy, Calendar, Link as LinkIcon, Flame } from "lucide-react";
import { calculateStreaks } from "@/lib/streaks";
import { usePlayerLastNameMap } from "@/hooks/usePlayers";
import { formatNameByLookup } from "@/lib/playerNames";

interface PlayerProfileDialogProps {
  playerName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileInfo {
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  typical_play_location: string | null;
  handedness: string | null;
  paddles: string[] | null;
  years_experience: number | null;
  dupr_rating: number | null;
  dupr_profile_url: string | null;
  awards: string[] | null;
  bio: string | null;
  discord_username: string | null;
  groupme_url: string | null;
}

export function PlayerProfileDialog({ playerName, open, onOpenChange }: PlayerProfileDialogProps) {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: allGames = [] } = useGames();
  const { data: avatarMap } = usePlayerAvatars();
  const lastNameMap = usePlayerLastNameMap();

  useEffect(() => {
    if (!playerName || !open) return;
    setLoading(true);
    setProfile(null);

    // Find profile by linked player name
    const fetchProfile = async () => {
      // First find the player ID
      const { data: playerData } = await supabase
        .from("players")
        .select("id")
        .eq("name", playerName)
        .single();

      if (playerData) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, city, state, typical_play_location, handedness, paddles, years_experience, dupr_rating, dupr_profile_url, awards, bio, discord_username, groupme_url")
          .eq("linked_player_id", playerData.id)
          .single();

        setProfile(profileData as ProfileInfo | null);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [playerName, open]);

  const playerGames = allGames.filter(g => g.player === playerName);
  const sortedGames = [...playerGames].sort((a, b) => b.date.localeCompare(a.date) || b.game - a.game);
  const currentMMR = sortedGames.length > 0 ? sortedGames[0]?.mmrAfter || 2000 : 2000;
  const wins = playerGames.filter(g => g.result === "Winner").length;
  const losses = playerGames.filter(g => g.result === "Loser").length;
  const winRate = playerGames.length > 0 ? Math.round((wins / playerGames.length) * 100) : 0;
  const streaks = calculateStreaks(playerGames);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="sr-only">Player Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
              <PlayerAvatar 
                name={playerName || ""} 
                avatarUrl={getPlayerAvatar(playerName || "", avatarMap)} 
                size="lg" 
              />
              <div>
                <h2 className="font-display text-2xl text-foreground">{playerName}</h2>
                {profile?.bio && (
                  <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* Rank */}
            {playerGames.length > 0 && (
              <div className="flex justify-center">
                <RankBadge mmr={currentMMR} gamesPlayed={playerGames.length} showMmr size="lg" />
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-display text-foreground">{currentMMR}</div>
                <div className="text-xs text-muted-foreground">MMR</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-display text-foreground">{winRate}%</div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-display text-foreground">{playerGames.length}</div>
                <div className="text-xs text-muted-foreground">Games</div>
              </div>
            </div>

            {/* Record & Streaks */}
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <div>
                <span className="text-primary font-medium">{wins}W</span>
                {" — "}
                <span className="text-destructive font-medium">{losses}L</span>
              </div>
              <div className="flex justify-center gap-4 text-xs">
                <span>
                  Current: {streaks.currentWinStreak > 0 ? (
                    <span className="text-primary font-medium">{streaks.currentWinStreak}W 🔥</span>
                  ) : streaks.currentLoseStreak > 0 ? (
                    <span className="text-destructive font-medium">{streaks.currentLoseStreak}L</span>
                  ) : '—'}
                </span>
                <span>Best: <span className="text-primary font-medium">{streaks.longestWinStreak}W</span></span>
              </div>
            </div>

            {/* Profile info */}
            {profile && (
              <div className="space-y-3 pt-2 border-t border-border">
                {(profile.city || profile.state) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    {[profile.city, profile.state].filter(Boolean).join(", ")}
                  </div>
                )}

                {profile.typical_play_location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    Plays at {profile.typical_play_location}
                  </div>
                )}

                {profile.handedness && (
                  <div className="text-sm text-muted-foreground">
                    ✋ {profile.handedness.charAt(0).toUpperCase() + profile.handedness.slice(1)}-handed
                  </div>
                )}

                {profile.years_experience && (
                  <div className="text-sm text-muted-foreground">
                    🎾 {profile.years_experience} year{profile.years_experience !== 1 ? "s" : ""} experience
                  </div>
                )}

                {profile.dupr_rating && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="w-4 h-4 text-primary" />
                    DUPR: {profile.dupr_rating}
                    {profile.dupr_profile_url && (
                      <a href={profile.dupr_profile_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                        View Profile
                      </a>
                    )}
                  </div>
                )}

                {(profile.paddles || []).length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">Paddles</div>
                    <div className="flex flex-wrap gap-1">
                      {profile.paddles!.map((p, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(profile.awards || []).length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">Awards</div>
                    <div className="flex flex-wrap gap-1">
                      {profile.awards!.map((a, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-accent/10 border-accent/30">
                          <Trophy className="w-3 h-3 mr-1" />{a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(profile.discord_username || profile.groupme_url) && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">Social</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {profile.discord_username && (
                        <span className="text-muted-foreground">Discord: {profile.discord_username}</span>
                      )}
                      {profile.groupme_url && (
                        <a href={profile.groupme_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          GroupMe
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!profile && !loading && (
              <p className="text-sm text-muted-foreground text-center pt-2 border-t border-border">
                This player hasn't set up their profile yet.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
